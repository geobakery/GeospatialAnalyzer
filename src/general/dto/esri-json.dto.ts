import { InternalServerErrorException } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  EsriEmptyPointDto,
  EsriPointDto,
  EsriPolygonDto,
  EsriPolylineDto,
} from './esri-geometry.dto';

@ApiExtraModels(
  EsriEmptyPointDto,
  EsriPointDto,
  EsriPolylineDto,
  EsriPolygonDto,
)
export class EsriJsonDto {
  @ApiPropertyOptional({
    anyOf: [
      { $ref: getSchemaPath(EsriEmptyPointDto) },
      { $ref: getSchemaPath(EsriPointDto) },
      { $ref: getSchemaPath(EsriPolylineDto) },
      { $ref: getSchemaPath(EsriPolygonDto) },
    ],
  })
  @Type(({ object }: { object: { geometry?: EsriJsonDto['geometry'] } }) => {
    // Since EsriJSON geometries don't have a discriminator, we must manually inspect the input.
    const geometry = object.geometry;

    if ('x' in geometry)
      return typeof geometry.x === 'number' ? EsriPointDto : EsriEmptyPointDto;

    if ('paths' in geometry) return EsriPolylineDto;
    if ('rings' in geometry) return EsriPolygonDto;

    // This is dead code, as long as the schema-based input validation works.
    throw new InternalServerErrorException(
      `Unexpected value for ${EsriJsonDto.name}.geometry`,
    );
  })
  geometry?:
    | EsriEmptyPointDto
    | EsriPointDto
    | EsriPolylineDto
    | EsriPolygonDto;

  @ApiPropertyOptional()
  attributes?: object;
}
