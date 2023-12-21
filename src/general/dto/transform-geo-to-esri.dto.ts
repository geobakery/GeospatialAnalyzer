import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GeoJsonDto } from './geo-json.dto';
import { Type } from 'class-transformer';

export class TransformGeoToEsriDto {
  @ApiProperty({
    type: [GeoJsonDto],
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
  @Type(() => GeoJsonDto)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  @IsArray()
  input: GeoJsonDto[];

  @ApiProperty({ example: '3035' })
  @IsNotEmpty()
  epsg: string;
}
