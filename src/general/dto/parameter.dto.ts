import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { outputFormatEnum } from '../general.constants';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { EsriJsonDto } from './esri-json.dto';
import { GeoJSONFeatureDto, GeoJSONFeatureCollectionDto } from './geo-json.dto';

@ApiExtraModels(GeoJSONFeatureCollectionDto, GeoJSONFeatureDto, EsriJsonDto)
export class ParameterDto {
  //https://github.com/typestack/class-validator#validation-decorators
  @ApiProperty({
    example: ['verw_kreis_f'],
    description: 'the topic name to check for',
  })
  @IsNotEmpty()
  topics: string[];

  @ApiProperty({
    oneOf: [
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
    description: 'the input geometry',
  })
  inputGeometries:
    | EsriJsonDto[]
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto
    | GeoJSONFeatureCollectionDto[];

  @ApiProperty({
    example: 'geojson',
    description: '',
  })
  @IsOptional()
  @IsEnum(outputFormatEnum)
  outputFormat: string;

  @ApiProperty({ example: false })
  @IsOptional()
  returnGeometry: boolean;

  @ApiProperty({
    example: 3,
    description: '',
  })
  @IsOptional()
  @IsInt()
  count: number;

  @ApiProperty({
    example: 10000,
    description: '',
  })
  @IsOptional()
  maxDistanceToNeighbour: number;

  @ApiProperty({
    example: 4326,
    description: '',
  })
  @ApiProperty({
    example: '4326',
  })
  @IsOptional()
  outSRS: string;
}
