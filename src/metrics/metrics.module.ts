import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseMetricsTracker } from './database-metrics.subscriber';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

/**
 * Module for Prometheus metrics collection and exposure
 * Provides automatic metrics collection for HTTP requests and database queries
 */
@Module({
  controllers: [MetricsController],
  providers: [
    MetricsService,
    DatabaseMetricsTracker,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
