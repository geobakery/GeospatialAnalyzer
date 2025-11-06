import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Metrics Registration', () => {
    it('should have httpRequestsTotal counter defined', () => {
      expect(service.httpRequestsTotal).toBeDefined();
    });

    it('should have httpRequestDuration histogram defined', () => {
      expect(service.httpRequestDuration).toBeDefined();
    });

    it('should have httpRequestSizeBytes histogram defined', () => {
      expect(service.httpRequestSizeBytes).toBeDefined();
    });

    it('should have httpResponseSizeBytes histogram defined', () => {
      expect(service.httpResponseSizeBytes).toBeDefined();
    });

    it('should have dbQueryDuration histogram defined', () => {
      expect(service.dbQueryDuration).toBeDefined();
    });

    it('should have dbQueriesTotal counter defined', () => {
      expect(service.dbQueriesTotal).toBeDefined();
    });

    it('should have activeConnections gauge defined', () => {
      expect(service.activeConnections).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics in Prometheus format', async () => {
      const metrics = await service.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });

    it('should include application label in metrics', async () => {
      const metrics = await service.getMetrics();
      expect(metrics).toContain('app="geospatialanalyzer"');
    });
  });

  describe('recordHttpRequest', () => {
    it('should record HTTP request metrics', async () => {
      service.recordHttpRequest('GET', '/within', 200, 0.5, 1024, 2048, [
        'test',
      ]);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_requests_total');
      expect(metrics).toContain('http_request_duration_seconds');
      expect(metrics).toContain('topic="test"');
    });

    it('should handle requests without topic', async () => {
      service.recordHttpRequest('POST', '/intersect', 200, 0.3, 512, 1024);

      const metrics = await service.getMetrics();
      expect(metrics).toContain('topic="none"');
    });

    it('should record separate metrics for each topic', async () => {
      service.recordHttpRequest(
        'POST',
        '/intersect',
        200,
        0.3,
        512,
        1024,
        ['kreis', 'land'],
      );

      const metrics = await service.getMetrics();
      expect(metrics).toContain('topic="kreis"');
      expect(metrics).toContain('topic="land"');
      // Should not contain combined topics
      expect(metrics).not.toContain('topic="kreis,land"');
    });
  });

  describe('recordDatabaseQuery', () => {
    it('should record successful database query', async () => {
      service.recordDatabaseQuery('SELECT', 0.01, 'success');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('db_query_duration_seconds');
      expect(metrics).toContain('db_queries_total');
    });

    it('should record failed database query', async () => {
      service.recordDatabaseQuery('SELECT', 0.05, 'error');

      const metrics = await service.getMetrics();
      expect(metrics).toContain('status="error"');
    });
  });

  describe('Active Connections', () => {
    it('should increment active connections', async () => {
      service.incrementActiveConnections();
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_active_connections');
    });

    it('should decrement active connections', async () => {
      service.incrementActiveConnections();
      service.incrementActiveConnections();
      service.decrementActiveConnections();
      const metrics = await service.getMetrics();
      expect(metrics).toContain('http_active_connections');
    });
  });

  describe('getRegistry', () => {
    it('should return the registry instance', () => {
      const registry = service.getRegistry();
      expect(registry).toBeDefined();
    });
  });
});
