import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { TransformEsriToGeoDto } from '../general/dto/transform-esri-to-geo.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';
import { TransformService } from './transform.service';

@ApiTags('Transform')
@Controller({
  version: '1',
})
export class TransformController {
  constructor(private readonly transformService: TransformService) {}

  @ApiResponse({
    status: 200,
    description:
      'Converts the geometries from GeoJSON (EPSG:4326) to EsriJSON with the provided EPSG code',
    type: EsriJsonDto,
    isArray: true,
  })
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Convert the geometries from GeoJSON (EPSG:4326) to EsriJSON with the provided EPSG code',
  })
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
      'Converts the geometries from EsriJSON with the provided EPSG code to GeoJSON (EPSG:4326)',
    type: GeoJSONFeatureDto,
    isArray: true,
  })
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Convert the geometries from EsriJSON with the provided EPSG code to GeoJSON (EPSG:4326)',
  })
  @Post('transformEsriJSONToGeoJSON')
  transformEsriJSONToGeoJSON(
    @Body() args: TransformEsriToGeoDto,
  ): GeoJSONFeatureDto[] {
    try {
      return this.transformService.convertEsriJSONToGeoJSON(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
