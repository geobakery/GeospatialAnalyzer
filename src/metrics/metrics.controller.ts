import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiExcludeController,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

const GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN =
  process.env.GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN;
const EXCLUDE_CONTROLLER_FROM_API_DOCS =
  GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN
    ? JSON.parse(GEOSPATIAL_ANALYZER_METRICS_ENDPOINT_HIDDEN)
    : process.env.NODE_ENV === 'production';

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
