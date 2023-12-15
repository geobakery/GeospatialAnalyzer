import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ValuesAtPointService } from './values-at-point.service';
import { ApiResponse } from '@nestjs/swagger';
import { GeoJSON } from 'typeorm';
import { ErrorResponse, EsriJSON } from '../general/general.interface';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';

@Controller({
  version: '1',
})
@Controller('values-at-point')
export class ValuesAtPointController {
  constructor(private readonly valuesAtPointService: ValuesAtPointService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: String,
    isArray: true,
  })
  @Get('valuesAtPoint/topics')
  topic(): string[] {
    return this.valuesAtPointService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the values at point',
    type: [GeoJsonDto],
    isArray: true,
  })
  @HttpCode(200)
  @Post('valuesAtPoint')
  async valuesAtPoint(
    @Body() args: ParameterDto,
  ): Promise<GeoJSON[] | EsriJSON | ErrorResponse | any[]> {
    try {
      return await this.valuesAtPointService.calculateValuesAtPoint(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
