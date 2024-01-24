import { GeoJSON } from 'typeorm';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { outputFormatEnum } from '../general.constants';
import { ApiProperty } from '@nestjs/swagger';
import { EsriJsonDto } from './esri-json.dto';
import { GeoJsonDto } from './geo-json.dto';

export class ParameterDto {
  //https://github.com/typestack/class-validator#validation-decorators
  @ApiProperty({
    example: ['verw_kreis_f'],
    description: 'the topic name to check for',
  })
  @IsNotEmpty()
  topics: string[];

  @ApiProperty({
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
  @IsArray()
  @ArrayNotEmpty()
  inputGeometries: EsriJsonDto[] | GeoJsonDto[];

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

  @ApiProperty({
    example: 60000,
    description: '',
  })
  @IsOptional()
  @Min(5000)
  @Max(100000)
  timeout: number;
}
