import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';
import { ErrorResponse, GeneralResponse } from '../general/general.interface';

@ApiTags('Health')
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
    isArray: false,
  })
  @HttpCode(200)
  @ApiOperation({
    summary: ' Returns the status of availability',
  })
  @Get('health')
  async getHealth(): Promise<GeneralResponse | ErrorResponse | any[]> {
    try {
      return await this.healthService.getCurrentHealth();
    } catch (e) {
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
