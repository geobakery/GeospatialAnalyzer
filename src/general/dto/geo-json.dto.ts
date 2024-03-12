import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  GeoJSONLineString,
  GeoJSONObject,
  GeoJSONPoint,
  GeoJSONPolygon,
} from './geo-geometry.dto';

@ApiExtraModels(GeoJSONLineString, GeoJSONPoint, GeoJSONPolygon)
export class GeoJSONFeatureDto {
  @ApiProperty({ enum: ['Feature'] })
  type: 'Feature';

  @ApiProperty({
    anyOf: [
      { $ref: getSchemaPath(GeoJSONLineString) },
      { $ref: getSchemaPath(GeoJSONPoint) },
      { $ref: getSchemaPath(GeoJSONPolygon) },
    ],
    nullable: true,
  })
  @Type(() => GeoJSONObject, {
    discriminator: {
      property: 'type',
      subTypes: [
        { name: 'LineString', value: GeoJSONLineString },
        { name: 'Point', value: GeoJSONPoint },
        { name: 'Polygon', value: GeoJSONPolygon },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  geometry: GeoJSONLineString | GeoJSONPoint | GeoJSONPolygon | null;

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
