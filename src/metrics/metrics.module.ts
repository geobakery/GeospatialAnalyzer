import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseMetricsSubscriber } from './database-metrics.subscriber';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

/**
 * Module for Prometheus metrics collection and exposure
 * Provides automatic metrics collection for HTTP requests and database queries
 * Can be conditionally enabled/disabled via configuration
 */
@Module({})
export class MetricsModule {
  /**
   * Register the metrics module with all providers and interceptors
   * Use this when metrics collection is enabled
   */
  static forRoot(): DynamicModule {
    return {
      module: MetricsModule,
      controllers: [MetricsController],
      providers: [
        MetricsService,
        DatabaseMetricsSubscriber,
        {
          provide: APP_INTERCEPTOR,
          useClass: MetricsInterceptor,
        },
      ],
      exports: [MetricsService],
    };
  }
}
