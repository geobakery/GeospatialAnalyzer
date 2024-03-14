import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GeoJSONFeatureDto, GeoJSONFeatureCollectionDto } from './geo-json.dto';

@ApiExtraModels(GeoJSONFeatureCollectionDto, GeoJSONFeatureDto)
export class TransformGeoToEsriDto {
  @ApiProperty({
    oneOf: [
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
    example: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [13.8192, 51.0206],
        },
        properties: {
          name: 'Dinagat Islands',
        },
      },
    ],
  })
  @Type(() => Array, {
    discriminator: {
      property: 'type',
      subTypes: [
        { name: 'Feature', value: GeoJSONFeatureDto },
        { name: 'FeatureCollection', value: GeoJSONFeatureCollectionDto },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  input:
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto[]
    | GeoJSONFeatureCollectionDto;

  @ApiProperty({
    example: 25833,
  })
  epsg: number;
}
