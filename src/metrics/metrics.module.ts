import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseMetricsSubscriber } from './database-metrics.subscriber';
import { MetricsInterceptor } from './metrics.interceptor';
import { MetricsService } from './metrics.service';

// controller requires all env vars to be loaded before code is evaluated (class decorators depend on env var)
function importMetricsControllerAfterAppInit() {
  return import('./metrics.controller.js').then(
    (module) => module.MetricsController,
  );
}

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
  static async forRoot(): Promise<DynamicModule> {
    return {
      module: MetricsModule,
      controllers: [await importMetricsControllerAfterAppInit()],
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
