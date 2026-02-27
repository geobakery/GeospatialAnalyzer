import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiExcludeController } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import * as dotenv from 'dotenv';

// we have to load this env var without using nestjs config service, because we need the value to define the module decorators
function preloadSpecificEnvVar(varName: string): string | undefined {
  const tempEnvStore : dotenv.DotenvPopulateInput = {} // loading in temp object to avoid any side-effects
  dotenv.config({path: ['.env.dev', '.env'], processEnv: tempEnvStore, quiet: true});
  return tempEnvStore[varName];
}

const GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN = preloadSpecificEnvVar('GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN');
const EXCLUDE_CONTROLLER_FROM_API_DOCS = GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN ? JSON.parse(GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN) : process.env.NODE_ENV === 'production';

/**
 * Controller for exposing Prometheus metrics endpoint
 */
@ApiTags('Metrics')
@ApiExcludeController(EXCLUDE_CONTROLLER_FROM_API_DOCS)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description:
      'Returns application metrics in Prometheus text format for scraping by Prometheus server',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return await this.metricsService.getMetrics();
  }
}
