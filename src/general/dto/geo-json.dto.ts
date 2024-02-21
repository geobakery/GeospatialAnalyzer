import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GeoGeometryDto } from './geo-geometry.dto';

@ApiExtraModels(GeoGeometryDto)
export class GeoJSONFeatureDto {
  @ApiProperty({ enum: ['Feature'] })
  type: 'Feature';

  @ApiProperty({
    anyOf: [{ $ref: getSchemaPath(GeoGeometryDto) }],
    nullable: true,
  })
  @Type(() => GeoGeometryDto)
  geometry: GeoGeometryDto | null;

  @ApiProperty()
  properties: object | null;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({
    items: { nullable: false }, // As close as we can get to the any-type
    required: false,
    type: 'array',
  })
  bbox?: any[];
}

@ApiExtraModels(GeoJSONFeatureDto)
export class GeoJSONFeatureCollectionDto {
  @ApiProperty({ enum: ['FeatureCollection'] })
  type: 'FeatureCollection';

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({
    items: { nullable: false }, // As close as we can get to the any-type
    required: false,
    type: 'array',
  })
  bbox?: any[];

  @ApiProperty({
    items: { $ref: getSchemaPath(GeoJSONFeatureDto) },
    type: 'array',
  })
  @Type(() => GeoJSONFeatureDto)
  features: GeoJSONFeatureDto[];
}
