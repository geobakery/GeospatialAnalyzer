import { IsArray, IsNotEmpty, IsOptional, Max } from 'class-validator';
import { SpatialRefereranceDto } from './spatial-refererance.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EsriGeometryDto {
  @ApiProperty()
  @IsOptional()
  x: number;

  @ApiProperty()
  @IsOptional()
  y: number;

  @ApiProperty()
  @IsOptional()
  z: number;

  @ApiProperty()
  @IsOptional()
  m: number;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  paths: number[];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  rings: number[];

  @ApiProperty()
  @IsArray()
  @IsOptional()
  points: number[];

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => SpatialRefereranceDto)
  spatialReference: SpatialRefereranceDto;
}
