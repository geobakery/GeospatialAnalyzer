import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
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
          coordinates: [125.6, 10.1],
        },
        properties: {
          name: 'Dinagat Islands',
        },
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [125.6, 10.1],
        },
        properties: {
          name: 'Dinagat Islands',
        },
      },
    ],
  })
  input:
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto[]
    | GeoJSONFeatureCollectionDto;

  @ApiProperty({
    example: 3035,
  })
  epsg: number;
}
