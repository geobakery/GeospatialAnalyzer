import { GeoJSON } from 'typeorm';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { outputFormatEnum, TOPICS } from '../general.constants';
import { ApiProperty } from '@nestjs/swagger';

export class ParameterDto {
  //https://github.com/typestack/class-validator#validation-decorators
  @ApiProperty({
    example: 'ver_land_f',
    description: 'the topic name to check for',
  })
  @IsNotEmpty()
  @IsIn(TOPICS, { each: true })
  topics: string[];

  @ApiProperty({
    example: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [411967, 5659861],
        },
        properties: {
          name: 'Dinagat Islands',
        },
      },
    ],
    description: 'the input geometry',
  })
  @IsArray()
  @ArrayNotEmpty()
  inputGeometries: GeoJSON[];

  @ApiProperty()
  @IsOptional()
  @IsEnum(outputFormatEnum)
  outputFormat: string;

  @ApiProperty()
  @IsOptional()
  returnGeometry: boolean;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  count: number;

  @ApiProperty()
  @IsOptional()
  maxDistanceToNeighbour: number;

  @ApiProperty()
  @IsOptional()
  outSRS: string;

  @ApiProperty()
  @IsOptional()
  @Min(5000)
  @Max(100000)
  timeout: number;
}
