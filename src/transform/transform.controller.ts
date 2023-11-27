import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { TransformService } from './transform.service';
import { ApiResponse } from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { TransformEsriToGeoDto } from '../general/dto/transform-esri-to-geo.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';

@Controller({
  version: '1',
})
@Controller('transform')
export class TransformController {
  constructor(private readonly transformService: TransformService) {}

  /*  @ApiResponse({
    status: 200,
    description:
      'Convert the geometries from GeoJSON (EPSG:4326) to EsriJSON with the provided EPSG code',
    type: EsriJsonDto,
  })*/

  @ApiResponse({
    status: 200,
    description:
      'Convert the geometries from GeoJSON (EPSG:4326) to EsriJSON with the provided EPSG code',
    type: [EsriJsonDto],
  })
  @HttpCode(200)
  @Post('transformGeoJSONToEsriJSON')
  transformGeoJSONToEsriJSON(
    @Body() args: TransformGeoToEsriDto,
  ): EsriJsonDto[] {
    try {
      return this.transformService.convertGeoJSONToEsriJSON(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiResponse({
    status: 200,
    description:
      'Convert the geometries from EsriJSON with the provided EPSG code to GeoJSON (EPSG:4326)',
    type: String,
  })
  @HttpCode(200)
  @Post('transformEsriJSONToGeoJSON')
  transformEsriJSONToGeoJSON(
    @Body() args: TransformEsriToGeoDto,
  ): GeoJsonDto[] {
    try {
      return this.transformService.convertEsriJSONToGeoJSON(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
