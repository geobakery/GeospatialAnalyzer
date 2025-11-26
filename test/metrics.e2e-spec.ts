import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '../src/metrics/metrics.controller';
import { MetricsModule } from '../src/metrics/metrics.module';
import { MetricsService } from '../src/metrics/metrics.service';

describe('Metrics (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MetricsModule.forRoot()],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/metrics (GET)', () => {
    it('should return metrics in Prometheus format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.body).toBeDefined();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should include application metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.body).toContain('geospatialanalyzer_http_requests_total');
      expect(response.body).toContain('geospatialanalyzer_http_request_duration_seconds');
      expect(response.body).toContain('geospatialanalyzer_db_query_duration_seconds');
      expect(response.body).toContain('app="geospatialanalyzer"');
    });

    it('should include Node.js default metrics', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.body).toContain('geospatialanalyzer_nodejs_heap_size');
      expect(response.body).toContain('process_cpu');
    });

    it('should update metrics after requests', async () => {
      const metricsService = app.get(MetricsService);

      // Record some metrics with single topic
      metricsService.recordHttpRequest(
        'POST',
        '/test',
        200,
        0.5,
        1024,
        2048,
        ['test-topic'],
      );

      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      expect(response.body).toContain('endpoint="/test"');
      expect(response.body).toContain('topic="test-topic"');
    });

    it('should record separate metrics for multiple topics', async () => {
      const metricsService = app.get(MetricsService);

      // Record metrics with multiple topics
      metricsService.recordHttpRequest(
        'POST',
        '/intersect',
        200,
        0.3,
        512,
        1024,
        ['kreis', 'land'],
      );

      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      // Should have separate metrics for each topic
      expect(response.body).toContain('topic="kreis"');
      expect(response.body).toContain('topic="land"');
      // Should not have combined topics
      expect(response.body).not.toContain('topic="kreis,land"');
    });

    it('should have zero-initialized metrics at startup', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics',
      });

      // Verify common endpoints are initialized even before any real requests
      expect(response.body).toContain('endpoint="/within"');
      expect(response.body).toContain('endpoint="/intersect"');
      expect(response.body).toContain('endpoint="/nearestNeighbour"');

      // Verify database metrics are initialized
      expect(response.body).toContain('query_type="SELECT"');
      expect(response.body).toContain('status="success"');

      // Verify active connections is initialized
      expect(response.body).toContain('geospatialanalyzer_http_active_connections');
    });
  });
});
