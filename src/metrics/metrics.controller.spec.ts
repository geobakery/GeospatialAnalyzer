import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [MetricsService],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics from service', async () => {
      const expectedMetrics = '# HELP test_metric Test metric\n# TYPE test_metric counter\ntest_metric 1\n';
      jest.spyOn(service, 'getMetrics').mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics();

      expect(result).toBe(expectedMetrics);
      expect(service.getMetrics).toHaveBeenCalled();
    });

    it('should return metrics in text format', async () => {
      const metrics = await controller.getMetrics();

      expect(typeof metrics).toBe('string');
      expect(metrics.length).toBeGreaterThan(0);
    });
  });
});
