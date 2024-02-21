import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { outputFormatEnum } from '../general.constants';
import { EsriJsonDto } from './esri-json.dto';
import { GeoJSONFeatureDto, GeoJSONFeatureCollectionDto } from './geo-json.dto';

@ApiExtraModels(EsriJsonDto, GeoJSONFeatureDto, GeoJSONFeatureCollectionDto)
export class ParameterDto {
  @ApiProperty({
    description: 'the topic name to check for',
    example: ['verw_kreis_f'],
    minItems: 1,
  })
  topics: string[];

  @ApiProperty({
    anyOf: [
      {
        type: 'array',
        items: { $ref: getSchemaPath(EsriJsonDto) },
      },
      {
        type: 'array',
        items: { $ref: getSchemaPath(GeoJSONFeatureDto) },
      },
      {
        type: 'array',
        items: { $ref: getSchemaPath(GeoJSONFeatureCollectionDto) },
      },
      { $ref: getSchemaPath(GeoJSONFeatureCollectionDto) },
    ],
    description: 'the input geometry',
    example: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.6645492, 51.0639403],
        },
        properties: {
          name: 'test_name',
        },
      },
    ],
  })
  inputGeometries:
    | EsriJsonDto[]
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto
    | GeoJSONFeatureCollectionDto[];

  @ApiProperty({
    enum: outputFormatEnum,
    example: 'geojson',
  })
  outputFormat: string;

  @ApiProperty({ example: false })
  returnGeometry: boolean;

  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ example: 10000 })
  maxDistanceToNeighbour: number;

  @ApiProperty({ example: '4326' })
  outSRS: string;

  @ApiProperty({
    example: 60_000,
    minimum: 5_000,
    maximum: 100_000,
  })
  timeout: number;
}
