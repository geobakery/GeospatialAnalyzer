import { IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { GeoGeometryDto } from './geo-geometry.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// TODO only for geojson single feature, currently hacked for both
export class GeoJsonDto {
  @ApiProperty()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => GeoGeometryDto)
  @IsOptional()
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

  @ApiProperty()
  @IsOptional()
  @Type(() => GeoJsonDto)
  features: GeoJsonDto[];
}
