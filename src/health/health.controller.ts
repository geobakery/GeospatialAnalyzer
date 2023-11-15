import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller({
  version: '1',
})
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): string {
    return this.healthService.getHealth();
  }
}
