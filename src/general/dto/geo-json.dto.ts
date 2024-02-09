import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional } from 'class-validator';
import { GeoGeometryDto } from './geo-geometry.dto';

export class GeoJSONFeatureDto {
  @ApiProperty({ enum: ['Feature'] })
  @IsIn(['Feature'])
  type: 'Feature';

  @ApiProperty()
  @IsNotEmpty()
  @Type(() => GeoGeometryDto)
  @IsOptional()
  geometry: GeoGeometryDto | null;

  @ApiProperty()
  @IsNotEmpty()
  properties: object;

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  bbox?: any[];
}

export class GeoJSONFeatureCollectionDto {
  @ApiProperty({ enum: ['FeatureCollection'] })
  @IsIn(['FeatureCollection'])
  type: 'FeatureCollection';

  @ApiProperty()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsArray()
  bbox?: any[];

  @ApiProperty({
    type: 'array',
    items: { $ref: getSchemaPath(GeoJSONFeatureDto) },
  })
  @IsArray()
  @Type(() => GeoJSONFeatureDto)
  features: GeoJSONFeatureDto[];
}
