import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
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
    example:
      '[\n' +
      '    {\n' +
      '  "type": "Feature",\n' +
      '  "geometry": {\n' +
      '    "type": "Point",\n' +
      '    "coordinates": [125.6, 10.1]\n' +
      '  },\n' +
      '  "properties": {\n' +
      '    "name": "Dinagat Islands"\n' +
      '  }\n' +
      '},\n' +
      '    {\n' +
      '  "type": "Feature",\n' +
      '  "geometry": {\n' +
      '    "type": "Point",\n' +
      '    "coordinates": [125.6, 10.1]\n' +
      '  },\n' +
      '  "properties": {\n' +
      '    "name": "Dinagat Islands"\n' +
      '  }\n' +
      '}\n' +
      ']',
  })
  input:
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto[]
    | GeoJSONFeatureCollectionDto;

  @ApiProperty({ example: '3035' })
  @IsNotEmpty()
  epsg: string;
}
