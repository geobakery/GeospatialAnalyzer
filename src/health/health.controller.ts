import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiResponse } from '@nestjs/swagger';

@Controller({
  version: '1',
})
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiResponse({
    status: 200,
    description: 'Simple health check',
    type: String,
    isArray: true,
  })
  @Get('health')
  getHealth(): string[] {
    return this.healthService.getHealth();
  }
}
