import { ApiProperty } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

type SupportedGeoJSONTypes = 'LineString' | 'Point' | 'Polygon';

const GeoJSONPositionSchemaObject = {
  items: { type: 'number' as const },
  minItems: 2,
  maxItems: 3,
  type: 'array' as const,
} as const;

type GeoJSONPosition = [number, number] | [number, number, number];

type BoundingBox =
  | [number, number, number, number]
  | [number, number, number, number, number, number];

export abstract class GeoJSONObject {
  @ApiProperty({ enum: ['LineString', 'Point', 'Polygon'] })
  type: SupportedGeoJSONTypes;

  @ApiProperty({
    anyOf: [
      { minItems: 4, maxItems: 4, type: 'array', items: { type: 'number' } },
      { minItems: 6, maxItems: 6, type: 'array', items: { type: 'number' } },
    ],
    required: false,
  })
  bbox?: BoundingBox;
}

export class GeoJSONLineString extends GeoJSONObject {
  @ApiProperty({ enum: ['LineString'] })
  type: 'LineString';

  @ApiProperty({
    items: GeoJSONPositionSchemaObject,
    type: 'array',
  })
  coordinates: GeoJSONPosition[];
}

export class GeoJSONPoint extends GeoJSONObject {
  @ApiProperty({ enum: ['Point'] })
  type: 'Point';

  @ApiProperty(GeoJSONPositionSchemaObject)
  coordinates: GeoJSONPosition;
}

export class GeoJSONPolygon extends GeoJSONObject {
  @ApiProperty({ enum: ['Polygon'] })
  type: 'Polygon';

  @ApiProperty({
    items: {
      items: GeoJSONPositionSchemaObject,
      type: 'array',
    },
    type: 'array',
  })
  coordinates: GeoJSONPosition[][];
}
