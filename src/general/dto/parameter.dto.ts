import { InternalServerErrorException } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { outputFormatEnum } from '../general.constants';
import { GeospatialRequest } from '../general.service';
import { EsriJsonDto } from './esri-json.dto';
import { GeoJSONFeatureCollectionDto, GeoJSONFeatureDto } from './geo-json.dto';

@ApiExtraModels(EsriJsonDto, GeoJSONFeatureDto, GeoJSONFeatureCollectionDto)
export class ParameterDto implements GeospatialRequest {
  @ApiProperty({
    description: 'the topic name to check for',
    example: ['verw_kreis_f'],
    minItems: 1,
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
  @ApiProperty({ example: ['hoehe2m_r'] })
  topics: string[];
}
export class WithinParameterDto extends ParameterDto {}
