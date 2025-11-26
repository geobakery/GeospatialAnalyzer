import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

/**
 * Interceptor to automatically collect metrics for all HTTP requests
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<any>();
    if (request.url === '/metrics') {
      return next.handle();
    }

    const startTime = Date.now();
    const response = context.switchToHttp().getResponse<any>();

    this.metricsService.incrementActiveConnections();

    const method = request.method;
    const endpoint = this.extractEndpoint(request.url);

    const requestSize = this.getRequestSize(request);

    let topics: string[] = [];
    if (request.body && typeof request.body === 'object') {
      topics = this.extractTopics(request.body);
    }

    const requestContext = { endpoint, topics };

    return this.metricsService.runWithContext(requestContext, () =>
      next.handle().pipe(
        tap((data) => {
          const duration = (Date.now() - startTime) / 1000;

          const responseSize = this.getResponseSize(data);

          const statusCode = response.statusCode;

          this.recordResultCount(endpoint, topics, data);

          this.metricsService.recordHttpRequest(
            method,
            endpoint,
            statusCode,
            duration,
            requestSize,
            responseSize,
            topics,
          );

          this.metricsService.decrementActiveConnections();
        }),
        catchError((error) => {
          const duration = (Date.now() - startTime) / 1000;

          const statusCode = error.status || 500;

          this.metricsService.recordHttpRequest(
            method,
            endpoint,
            statusCode,
            duration,
            requestSize,
            0,
            topics,
          );

          this.metricsService.decrementActiveConnections();

          return throwError(() => error);
        }),
      ),
    );
  }

  /**
   * Extract the endpoint path without query parameters and path parameters
   */
  private extractEndpoint(url: string): string {
    const withoutQuery = url.split('?')[0];

    const withoutVersion = withoutQuery.replace(/^\/v\d+/, '');

    const normalized = withoutVersion
      .replace(/\/\d+/g, '/:id')
      .replace(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '/:uuid',
      );

    return normalized || '/';
  }

  /**
   * Extract topics from request body
   * Returns an array of topic strings
   */
  private extractTopics(body: any): string[] {
    if (!body) return [];

    if (typeof body.topic === 'string') {
      return [body.topic];
    }

    if (Array.isArray(body.topics) && body.topics.length > 0) {
      return body.topics.filter((t: any) => typeof t === 'string');
    }

    return [];
  }

  /**
   * Get request size in bytes
   */
  private getRequestSize(request: any): number {
    const contentLength = request.headers['content-length'];
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    if (request.body) {
      try {
        return Buffer.byteLength(JSON.stringify(request.body), 'utf8');
      } catch {
        return 0;
      }
    }

    return 0;
  }

  /**
   * Get response size in bytes
   */
  private getResponseSize(data: any): number {
    if (!data) return 0;

    try {
      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      }
      return Buffer.byteLength(JSON.stringify(data), 'utf8');
    } catch {
      return 0;
    }
  }

  /**
   * Record the number of results returned in the response
   */
  private recordResultCount(
    endpoint: string,
    topics: string[],
    data: any,
  ): void {
    if (!data || !Array.isArray(data)) {
      return;
    }

    const resultsByTopic = new Map<string, number>();

    data.forEach((item: any) => {
      const itemTopic = item?.topic;
      
      if (!itemTopic) {
        return;
      }

      const featureCount = Array.isArray(item?.response?.features)
        ? item.response.features.length
        : 0;

      resultsByTopic.set(
        itemTopic,
        (resultsByTopic.get(itemTopic) || 0) + featureCount,
      );
    });

    resultsByTopic.forEach((count, topic) => {
      this.metricsService.recordResultsCount(endpoint, topic, count);
    });

    if (resultsByTopic.size === 0 && topics.length > 0) {
      topics.forEach((topic) => {
        this.metricsService.recordResultsCount(endpoint, topic, 0);
      });
    }
  }
}
