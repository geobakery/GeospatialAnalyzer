# Metrics Endpoint

## Overview

The GeospatialAnalyzer provides Prometheus-compatible metrics for monitoring application performance and health. The metrics are exposed at the `/metrics` endpoint and can be scraped by Prometheus for visualization in Grafana.

## Configuration

Metrics collection can be enabled or disabled via environment variable:

```bash
# Enable metrics (default)
GEOSPATIAL_ANALYZER_METRICS_ENABLED=true

# Disable metrics
GEOSPATIAL_ANALYZER_METRICS_ENABLED=false
```

**Default:** Metrics are **enabled** by default for backward compatibility.

When disabled:
- The `/metrics` endpoint will not be registered
- No HTTP request interception occurs
- No database query tracking is performed
- No performance overhead from metrics collection

Add this configuration to your `.env`, `.env.dev`, or `.env.test` files as needed.

## Endpoint

**URL:** `GET /metrics`

**Content-Type:** `text/plain; version=0.0.4; charset=utf-8`

**Description:** Returns application metrics in Prometheus text format

## Metrics Summary

The following metrics are available:

**HTTP Metrics:**
- `http_requests_total` - Total number of HTTP requests (labeled by method, endpoint, status_code, topic)
- `http_request_duration_seconds` - HTTP request duration histogram
- `http_request_size_bytes` - HTTP request size histogram
- `http_response_size_bytes` - HTTP response size histogram
- `http_active_connections` - Current number of active HTTP connections

**Database Metrics:**
- `db_query_duration_seconds` - Database query duration histogram (labeled by query_type, endpoint)
- `db_queries_total` - Total number of database queries (labeled by query_type, status, endpoint)

**Application Metrics:**
- `query_results_returned` - Number of results returned per query (labeled by endpoint, topic)

**System Metrics:**
- `geospatialanalyzer_nodejs_*` - Standard Node.js runtime metrics (heap, CPU, event loop, etc.)

## Available Metrics

### HTTP Request Metrics

#### `http_requests_total`
- **Type:** Counter
- **Description:** Total number of HTTP requests
- **Labels:**
  - `method`: HTTP method (GET, POST, etc.)
  - `endpoint`: Normalized endpoint path (e.g., `/within`, `/intersect`)
  - `status_code`: HTTP response status code
  - `topic`: Topic used in the request. When a request includes multiple topics (e.g., `["kreis", "land"]`), a separate metric is recorded for each topic
  - `app`: Application name (always "geospatialanalyzer")
- **Note:** For requests with multiple topics, each topic generates a separate counter increment. For example, a request with `topics: ["kreis", "land"]` will increment both `topic="kreis"` and `topic="land"` counters.

#### `http_request_duration_seconds`
- **Type:** Histogram
- **Description:** Duration of HTTP requests in seconds
- **Labels:**
  - `method`: HTTP method
  - `endpoint`: Normalized endpoint path
  - `app`: Application name
- **Buckets:** 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30 seconds

#### `http_request_size_bytes`
- **Type:** Histogram
- **Description:** Size of HTTP request payloads in bytes
- **Labels:**
  - `method`: HTTP method
  - `endpoint`: Normalized endpoint path
  - `app`: Application name
- **Buckets:** 100, 1000, 10000, 100000, 1000000, 10000000 bytes

#### `http_response_size_bytes`
- **Type:** Histogram
- **Description:** Size of HTTP response payloads in bytes
- **Labels:**
  - `method`: HTTP method
  - `endpoint`: Normalized endpoint path
  - `app`: Application name
- **Buckets:** 100, 1000, 10000, 100000, 1000000, 10000000 bytes

#### `http_active_connections`
- **Type:** Gauge
- **Description:** Current number of active HTTP connections
- **Labels:**
  - `app`: Application name

### Database Metrics

#### `db_query_duration_seconds`
- **Type:** Histogram
- **Description:** Duration of database queries in seconds
- **Labels:**
  - `query_type`: Type of SQL query (SELECT, INSERT, UPDATE, DELETE, etc.)
  - `endpoint`: The API endpoint that initiated the query (e.g., `/intersect`, `/within`, `/nearestNeighbour`, `/valuesAtPoint`)
  - `app`: Application name
- **Buckets:** 0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10 seconds

#### `db_queries_total`
- **Type:** Counter
- **Description:** Total number of database queries executed
- **Labels:**
  - `query_type`: Type of SQL query
  - `status`: Query execution status (success or error)
  - `endpoint`: The API endpoint that initiated the query
  - `app`: Application name

### Application Metrics

#### `query_results_returned`
- **Type:** Histogram
- **Description:** Number of results returned per query
- **Labels:**
  - `endpoint`: API endpoint path
  - `topic`: Topic queried (e.g., "kreis", "land", "parcels")
  - `app`: Application name
- **Buckets:** 0, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000 results

### System Metrics

The application also exposes standard Node.js metrics with the `geospatialanalyzer_` prefix:

- `geospatialanalyzer_nodejs_heap_size_total_bytes`: Total heap size
- `geospatialanalyzer_nodejs_heap_size_used_bytes`: Used heap size
- `geospatialanalyzer_nodejs_external_memory_bytes`: External memory usage
- `geospatialanalyzer_nodejs_eventloop_lag_seconds`: Event loop lag
- `geospatialanalyzer_process_cpu_user_seconds_total`: CPU user time
- `geospatialanalyzer_process_cpu_system_seconds_total`: CPU system time
- And more...

## Example Output

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",endpoint="/within",status_code="200",topic="parcels",app="geospatialanalyzer"} 42
http_requests_total{method="POST",endpoint="/intersect",status_code="200",topic="kreis",app="geospatialanalyzer"} 15
http_requests_total{method="POST",endpoint="/intersect",status_code="200",topic="land",app="geospatialanalyzer"} 15

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.01",method="POST",endpoint="/within",app="geospatialanalyzer"} 15
http_request_duration_seconds_bucket{le="0.05",method="POST",endpoint="/within",app="geospatialanalyzer"} 38
http_request_duration_seconds_sum{method="POST",endpoint="/within",app="geospatialanalyzer"} 12.34
http_request_duration_seconds_count{method="POST",endpoint="/within",app="geospatialanalyzer"} 42

# HELP db_query_duration_seconds Duration of database queries in seconds
# TYPE db_query_duration_seconds histogram
db_query_duration_seconds_bucket{le="0.01",query_type="SELECT",endpoint="/intersect",app="geospatialanalyzer"} 120
db_query_duration_seconds_sum{query_type="SELECT",endpoint="/intersect",app="geospatialanalyzer"} 5.67
db_query_duration_seconds_count{query_type="SELECT",endpoint="/intersect",app="geospatialanalyzer"} 150

# HELP db_queries_total Total number of database queries executed
# TYPE db_queries_total counter
db_queries_total{query_type="SELECT",status="success",endpoint="/within",app="geospatialanalyzer"} 200
db_queries_total{query_type="SELECT",status="success",endpoint="/intersect",app="geospatialanalyzer"} 150

# HELP query_results_returned Number of results returned per query
# TYPE query_results_returned histogram
query_results_returned_bucket{le="1",endpoint="/intersect",topic="kreis",app="geospatialanalyzer"} 10
query_results_returned_bucket{le="5",endpoint="/intersect",topic="kreis",app="geospatialanalyzer"} 25
query_results_returned_sum{endpoint="/intersect",topic="kreis",app="geospatialanalyzer"} 48
query_results_returned_count{endpoint="/intersect",topic="kreis",app="geospatialanalyzer"} 30
```

## Prometheus Configuration

To scrape metrics from the GeospatialAnalyzer, add the following job to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'geospatialanalyzer'
    scrape_interval: 15s
    static_configs:
      - targets: ['geospatialanalyzer:3000']
    metrics_path: '/metrics'
```

### Kubernetes Configuration

For Kubernetes deployments, you can use service discovery and annotations:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: geospatialanalyzer
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/path: "/metrics"
    prometheus.io/port: "3000"
spec:
  selector:
    app: geospatialanalyzer
  ports:
    - port: 3000
      targetPort: 3000
```

## Grafana Dashboard

### Example Queries

#### Request Rate
```promql
rate(http_requests_total{app="geospatialanalyzer"}[5m])
```

#### Average Response Time
```promql
rate(http_request_duration_seconds_sum{app="geospatialanalyzer"}[5m]) / 
rate(http_request_duration_seconds_count{app="geospatialanalyzer"}[5m])
```

#### 95th Percentile Response Time
```promql
histogram_quantile(0.95, 
  rate(http_request_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
)
```

#### Error Rate
```promql
rate(http_requests_total{app="geospatialanalyzer",status_code=~"5.."}[5m])
```

#### Request Count by Topic
```promql
sum by (topic) (
  rate(http_requests_total{app="geospatialanalyzer"}[5m])
)
```

#### Database Query Performance
```promql
histogram_quantile(0.95, 
  rate(db_query_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
)
```

#### Database Query Performance by Endpoint
```promql
histogram_quantile(0.95, 
  sum by (endpoint, le) (
    rate(db_query_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
  )
)
```

#### Database Query Rate by Type
```promql
sum by (query_type) (
  rate(db_queries_total{app="geospatialanalyzer"}[5m])
)
```

#### Database Query Rate by Endpoint
```promql
sum by (endpoint) (
  rate(db_queries_total{app="geospatialanalyzer"}[5m])
)
```

#### Average Results Returned
```promql
rate(query_results_returned_sum{app="geospatialanalyzer"}[5m]) /
rate(query_results_returned_count{app="geospatialanalyzer"}[5m])
```

#### Results Distribution by Topic
```promql
histogram_quantile(0.95,
  sum by (topic, le) (
    rate(query_results_returned_bucket{app="geospatialanalyzer"}[5m])
  )
)
```

## Monitoring Best Practices

### Alerts

Set up alerts for critical metrics:

```yaml
groups:
  - name: geospatialanalyzer
    rules:
      - alert: HighErrorRate
        expr: |
          rate(http_requests_total{app="geospatialanalyzer",status_code=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95, 
            rate(http_request_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
          ) > 5
        for: 5m
        annotations:
          summary: "95th percentile response time is over 5 seconds"
          
      - alert: SlowDatabaseQueries
        expr: |
          histogram_quantile(0.95, 
            rate(db_query_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
          ) > 2
        for: 5m
        annotations:
          summary: "Database queries are slow"
          
      - alert: SlowDatabaseQueriesByEndpoint
        expr: |
          histogram_quantile(0.95, 
            sum by (endpoint, le) (
              rate(db_query_duration_seconds_bucket{app="geospatialanalyzer"}[5m])
            )
          ) > 5
        for: 5m
        annotations:
          summary: "Database queries are slow for {{ $labels.endpoint }}"
          
      - alert: LowResultCounts
        expr: |
          rate(query_results_returned_sum{app="geospatialanalyzer"}[5m]) /
          rate(query_results_returned_count{app="geospatialanalyzer"}[5m]) < 1
        for: 10m
        annotations:
          summary: "Queries are returning very few results"
```

### Dashboard Panels

Recommended panels for your Grafana dashboard:

1. **Request Rate**: Total requests per second
2. **Response Time**: Average, median, 95th, and 99th percentiles
3. **Error Rate**: Percentage of 4xx and 5xx errors
4. **Request Count by Endpoint**: Top endpoints by request count
5. **Request Count by Topic**: Which topics are most used
6. **Database Query Performance**: Query duration by type and endpoint
7. **Database Query Rate**: Queries per second by endpoint
8. **Results Returned**: Average and distribution of results per query
9. **Results by Topic**: Which topics return most results
10. **Active Connections**: Current number of active connections
11. **Memory Usage**: Heap size and external memory
12. **CPU Usage**: Process CPU time

## Testing the Metrics Endpoint

### Using curl

```bash
curl http://localhost:3000/metrics
```

### Using a Browser

Navigate to: `http://localhost:3000/metrics`

### Verify in Swagger UI

The metrics endpoint is also documented in the Swagger UI:
`http://localhost:3000/api`

## Architecture Notes

The metrics implementation uses:

- **In-app approach**: Metrics are collected directly within the application (not sidecar)
- **prom-client**: Official Prometheus client library for Node.js
- **NestJS Interceptor**: For automatic HTTP request tracking
- **TypeORM QueryBuilder Interception**: For database query tracking
- **AsyncLocalStorage**: For tracking request context across async operations
- **Global Registry**: Centralized metrics storage and exposition

### Request Context Tracking

The metrics system uses Node.js `AsyncLocalStorage` to maintain request context throughout the entire request lifecycle. This enables database metrics to be labeled with the endpoint that initiated them, even though database queries happen deep in the call stack.

**How it works:**
1. HTTP interceptor creates a request context containing endpoint and topics
2. Context is stored in AsyncLocalStorage when handling the request
3. Database query interceptor retrieves the context to add endpoint labels
4. Context is automatically cleaned up when the request completes

This approach ensures accurate attribution of database queries to API endpoints without passing context explicitly through every function call.

