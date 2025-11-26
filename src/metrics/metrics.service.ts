import { Injectable, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import * as client from 'prom-client';

/**
 * Context for tracking the current request
 */
export interface RequestContext {
  endpoint?: string;
  topics?: string[];
}

/**
 * Service for managing Prometheus metrics collection
 * Provides HTTP request metrics, database metrics, and custom application metrics
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  // HTTP Metrics
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly httpRequestDuration: client.Histogram<string>;
  public readonly httpRequestSizeBytes: client.Histogram<string>;
  public readonly httpResponseSizeBytes: client.Histogram<string>;

  // Database Metrics
  public readonly dbQueryDuration: client.Histogram<string>;
  public readonly dbQueriesTotal: client.Counter<string>;

  // Application Metrics
  public readonly activeConnections: client.Gauge<string>;
  public readonly resultsReturned: client.Histogram<string>;

  constructor() {
    this.registry = new client.Registry();

    this.registry.setDefaultLabels({
      app: 'geospatialanalyzer',
    });

    this.httpRequestsTotal = new client.Counter({
      name: 'geospatialanalyzer_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status_code', 'topic'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new client.Histogram({
      name: 'geospatialanalyzer_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
      registers: [this.registry],
    });

    this.httpRequestSizeBytes = new client.Histogram({
      name: 'geospatialanalyzer_http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'endpoint'],
      buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
      registers: [this.registry],
    });

    this.httpResponseSizeBytes = new client.Histogram({
      name: 'geospatialanalyzer_http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'endpoint'],
      buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
      registers: [this.registry],
    });

    this.dbQueryDuration = new client.Histogram({
      name: 'geospatialanalyzer_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['query_type', 'endpoint'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.dbQueriesTotal = new client.Counter({
      name: 'geospatialanalyzer_db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['query_type', 'status', 'endpoint'],
      registers: [this.registry],
    });

    this.activeConnections = new client.Gauge({
      name: 'geospatialanalyzer_http_active_connections',
      help: 'Number of active HTTP connections',
      registers: [this.registry],
    });

    this.resultsReturned = new client.Histogram({
      name: 'geospatialanalyzer_query_results_returned',
      help: 'Number of results returned per query',
      labelNames: ['endpoint', 'topic'],
      buckets: [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000],
      registers: [this.registry],
    });
  }

  onModuleInit() {
    client.collectDefaultMetrics({
      register: this.registry,
      prefix: 'geospatialanalyzer_',
    });

    // Initialize metrics with zero values to ensure time series exist
    this.initializeMetrics();
  }

  /**
   * Initialize all metrics with zero values for common label combinations
   * This ensures that metrics are available in Prometheus even before any requests are made
   * and prevents "no data" errors in dashboards and alerts
   */
  private initializeMetrics(): void {
    const endpoints = [
      '/within',
      '/intersect',
      '/nearestNeighbour',
      '/valuesAtPoint',
      '/transform',
      '/health',
      '/topics',
    ];
    const methods = ['GET', 'POST'];
    const statusCodes = ['200', '400', '404', '500'];
    const statuses: ('success' | 'error')[] = ['success', 'error'];

    // Initialize HTTP request counters with zero
    // Counters need to be incremented (by 0) to appear in metrics output
    endpoints.forEach((endpoint) => {
      methods.forEach((method) => {
        statusCodes.forEach((statusCode) => {
          // Initialize with 'none' topic for endpoints that may not have topics
          this.httpRequestsTotal.inc(
            { method, endpoint, status_code: statusCode, topic: 'none' },
            0,
          );
        });

        // Initialize histograms by observing zero
        // This creates the time series but doesn't affect statistics
        this.httpRequestDuration.observe({ method, endpoint }, 0);
        this.httpRequestSizeBytes.observe({ method, endpoint }, 0);
        this.httpResponseSizeBytes.observe({ method, endpoint }, 0);
      });
    });

    // Initialize database query metrics
    // Only SELECT queries are used in this read-only API
    endpoints.forEach((endpoint) => {
      this.dbQueryDuration.observe({ query_type: 'SELECT', endpoint }, 0);

      statuses.forEach((status) => {
        this.dbQueriesTotal.inc(
          { query_type: 'SELECT', status, endpoint },
          0,
        );
      });
    });

    // Initialize active connections gauge with zero
    this.activeConnections.set(0);

    // Note: resultsReturned metrics are topic-specific and will be initialized
    // on first use since topics are dynamic and loaded from configuration
  }

  /**
   * Get metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Get the registry instance for advanced use cases
   */
  getRegistry(): client.Registry {
    return this.registry;
  }

  /**
   * Record an HTTP request
   * If multiple topics are provided, records a separate metric for each topic
   */
  recordHttpRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    requestSize: number,
    responseSize: number,
    topics?: string[],
  ): void {
    // If no topics provided, record once with 'none'
    const topicsToRecord = topics && topics.length > 0 ? topics : ['none'];

    topicsToRecord.forEach((topic) => {
      this.httpRequestsTotal.inc({
        method,
        endpoint,
        status_code: statusCode.toString(),
        topic,
      });
    });

    this.httpRequestDuration.observe(
      {
        method,
        endpoint,
      },
      duration,
    );

    this.httpRequestSizeBytes.observe(
      {
        method,
        endpoint,
      },
      requestSize,
    );

    this.httpResponseSizeBytes.observe(
      {
        method,
        endpoint,
      },
      responseSize,
    );
  }

  /**
   * Record a database query
   */
  recordDatabaseQuery(
    queryType: string,
    duration: number,
    status: 'success' | 'error',
  ): void {
    const context = this.asyncLocalStorage.getStore();
    const endpoint = context?.endpoint || 'unknown';

    this.dbQueryDuration.observe(
      {
        query_type: queryType,
        endpoint,
      },
      duration,
    );

    this.dbQueriesTotal.inc({
      query_type: queryType,
      status,
      endpoint,
    });
  }

  /**
   * Run a function within a request context
   */
  runWithContext<T>(context: RequestContext, fn: () => T): T {
    return this.asyncLocalStorage.run(context, fn);
  }

  /**
   * Get the current request context
   */
  getCurrentContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Record the number of results returned
   */
  recordResultsCount(endpoint: string, topic: string, count: number): void {
    this.resultsReturned.observe(
      {
        endpoint,
        topic,
      },
      count,
    );
  }

  /**
   * Increment active connections
   */
  incrementActiveConnections(): void {
    this.activeConnections.inc();
  }

  /**
   * Decrement active connections
   */
  decrementActiveConnections(): void {
    this.activeConnections.dec();
  }
}
