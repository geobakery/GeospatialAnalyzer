import { Controller, Post } from '@nestjs/common';
import { ValuesAtPointService } from './values-at-point.service';
import { ApiResponse } from '@nestjs/swagger';
import { GeoJSON } from 'typeorm';
import { ErrorResponse, EsriJSON } from '../general/general.interface';

@Controller({
  version: '1',
})
@Controller('values-at-point')
export class ValuesAtPointController {
  constructor(private readonly valuesAtPointService: ValuesAtPointService) {}

  @ApiResponse({
    status: 200,
    description: 'Calculate the values at point',
    type: String,
  })
  @Post('values-at-point')
  valuesAtPoint(): GeoJSON | EsriJSON | ErrorResponse {
    return this.valuesAtPointService.calculateValuesAtPoint();
  }
}
