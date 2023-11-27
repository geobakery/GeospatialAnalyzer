import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { GeoGeometryDto } from './geo-geometry.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GeoJsonDto {
  @ApiProperty()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  geometry: GeoGeometryDto;

  @ApiProperty()
  @IsNotEmpty()
  properties: object;

  @ApiProperty()
  @IsOptional()
  description: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  bbox: any[];
}
