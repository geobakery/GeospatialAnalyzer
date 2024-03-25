import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SpatialReferenceDto } from './spatial-reference.dto';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

const EsriJSONPositionSchemaObject: Omit<SchemaObject, 'required'> = {
  items: { type: 'number' },
  minItems: 2,
  maxItems: 4,
  type: 'array',
};

type EsriJSONPosition =
  | [number, number]
  | [number, number, number]
  | [number, number, number, number];

@ApiExtraModels(SpatialReferenceDto)
export abstract class EsriGeometryDto {
  @ApiProperty()
  @Type(() => SpatialReferenceDto)
  spatialReference: SpatialReferenceDto;
}

/**
 * @see {@link https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm#POINT}
 *      "A point is empty when its x field is present and has the value null or the string "NaN"."
 *      From the examples it appears that an empty point may omit the mandatory y coordinate.
 */
export class EsriEmptyPointDto extends EsriGeometryDto {
  @ApiProperty({
    enum: ['NaN', null],
    nullable: true,
  })
  x: 'NaN' | null;
}
export class EsriPointDto extends EsriGeometryDto {
  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiPropertyOptional()
  z?: number;

  @ApiPropertyOptional()
  m?: number;
}

export class EsriPolylineDto extends EsriGeometryDto {
  @ApiPropertyOptional()
  hasM?: boolean;

  @ApiPropertyOptional()
  hasZ?: boolean;

  @ApiProperty({
    items: {
      items: EsriJSONPositionSchemaObject,
      type: 'array',
    },
    type: 'array',
    maxLength: 1, // More than one ring would correspond to a GeoJSON MultiLineString, which we do not support.
  })
  paths: EsriJSONPosition[];
}

export class EsriPolygonDto extends EsriGeometryDto {
  @ApiPropertyOptional()
  hasM?: boolean;

  @ApiPropertyOptional()
  hasZ?: boolean;

  @ApiProperty({
    items: {
      items: EsriJSONPositionSchemaObject,
      type: 'array',
    },
    type: 'array',
    maxLength: 1, // More than one ring would correspond to a GeoJSON MultiPolygon, which we do not support.
  })
  rings: EsriJSONPosition[][];
}
