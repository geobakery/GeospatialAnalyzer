import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { WithinService } from './within.service';
import { ApiResponse } from '@nestjs/swagger';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import { ErrorResponse, EsriJSON } from '../general/general.interface';

@Controller({
  version: '1',
})
@Controller('within')
export class WithinController {
  constructor(private readonly withinService: WithinService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: String,
    isArray: true,
  })
  @Get('within/topics')
  topic(): string[] {
    return this.withinService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the within',
    type: String,
  })
  @HttpCode(200)
  @Post('within')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSON[] | EsriJSON | ErrorResponse | any[]> {
    try {
      return await this.withinService.calculateWithin(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}