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
          coordinates: [411967, 5659861],
          crs: {
            type: 'name',
            properties: {
              name: 'EPSG:25833',
            },
          },
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
  inputGeometries: GeoJSON[];

  @ApiProperty({
    example: 'geojson',
    description: '',
  })
  @IsOptional()
  @IsEnum(outputFormatEnum)
  outputFormat: string;

  @ApiProperty({
    example: true,
    description: '',
  })
  @ApiProperty()
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
  @ApiProperty()
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
