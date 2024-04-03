import { InternalServerErrorException } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { Type } from 'class-transformer';
import { outputFormatEnum } from '../general.constants';
import { GeospatialRequest } from '../general.service';
import { EsriJsonDto } from './esri-json.dto';
import { GeoJSONFeatureCollectionDto, GeoJSONFeatureDto } from './geo-json.dto';

/**
 * GeoJSON always uses WGS 84, so we want to prevent users from requesting
 * GeoJSON responses in any other SRS.
 *
 * Currently, NestJS does not allow to define schemas on the DTO classes itself.
 * As a workaround, use this {@link SchemaObject} and merge it into the schema
 * at the site of use of {@link ParameterDto}.
 *
 * @example Merging this SchemaObject with an actual ParameterDto SchemaObject
 * ```json
 * {
 *   // Both the actual DTO and the additional constraint must match
 *   allOf: [
 *     // The ParamaterDto-subtype you actually want to use
 *     { $ref: getSchemaPath(MyParameterDto) },
 *     // The additional outSRS/outputFormat validation
 *     SCHEMA_VALID_OUT_SRS,
 *   ],
 * }
 * ```
 */
export const SCHEMA_VALID_OUT_SRS: Readonly<SchemaObject> = {
  anyOf: [
    {
      properties: {
        outSRS: { type: 'number', enum: [4326] },
        outputFormat: { type: 'string', enum: ['geojson'] },
      },
    },
    {
      properties: {
        outputFormat: { type: 'string', enum: ['esrijson'] },
      },
    },
  ],
};

@ApiExtraModels(EsriJsonDto, GeoJSONFeatureDto, GeoJSONFeatureCollectionDto)
export class ParameterDto implements GeospatialRequest {
  @ApiProperty({
    description: 'the topic name to check for',
    example: ['kreis'],
    minItems: 1,
    uniqueItems: true,
  })
  topics: string[];

  @ApiProperty({
    anyOf: [
      {
        type: 'array',
        items: { $ref: getSchemaPath(EsriJsonDto) },
      },
      {
        type: 'array',
        items: { $ref: getSchemaPath(GeoJSONFeatureDto) },
      },
      {
        type: 'array',
        items: { $ref: getSchemaPath(GeoJSONFeatureCollectionDto) },
      },
      { $ref: getSchemaPath(GeoJSONFeatureCollectionDto) },
    ],
    description: 'the input geometry',
    example: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.6645492, 51.0639403],
        },
        properties: {
          name: 'test_name',
        },
      },
    ],
  })
  @Type(({ object }) => {
    // Since GeoJSON and EsriJSON don't share a common discriminator property, we must manually inspect the input.

    // We accept homogenous arrays only, so looking at the first element suffices. Since we
    // also accept a single FeatureCollection, we normalize the argument to an array first
    const inputGeometry:
      | EsriJsonDto
      | GeoJSONFeatureDto
      | GeoJSONFeatureCollectionDto
      | undefined = [].concat(object.inputGeometries)?.[0];

    if (inputGeometry === undefined) return Array; // No geometries -> Type does not matter
    if (!('type' in inputGeometry)) return EsriJsonDto;
    if (inputGeometry.type === 'Feature') return GeoJSONFeatureDto;
    if (inputGeometry.type === 'FeatureCollection')
      return GeoJSONFeatureCollectionDto;

    // This is dead code, as long as the schema-based input validation works.
    throw new InternalServerErrorException(
      `Unexpected value for ${ParameterDto.name}.inputGeometries`,
    );
  })
  inputGeometries:
    | EsriJsonDto[]
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto
    | GeoJSONFeatureCollectionDto[];

  @ApiProperty({
    enum: outputFormatEnum,
    example: 'geojson',
  })
  outputFormat: string;

  @ApiProperty({ example: false })
  returnGeometry: boolean;

  @ApiProperty({ example: 4326 })
  outSRS: number;
}

export class IntersectParameterDto extends ParameterDto {}
export class NearestNeighbourParameterDto extends ParameterDto {
  @ApiProperty({ example: 3 })
  count: number;

  @ApiProperty({ example: 10000 })
  maxDistanceToNeighbour: number;
}
export class ValuesAtPointParameterDto extends ParameterDto {
  @ApiProperty({
    example: ['hoehe'],
    description: 'the topic name to check for',
  })
  topics: string[];
}
export class WithinParameterDto extends ParameterDto {}
