import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EsriJsonDto } from './esri-json.dto';
import { Type } from 'class-transformer';

export class TransformEsriToGeoDto {
  @ApiProperty({
    type: [EsriJsonDto],
    example:
      '[\n' +
      '  {\n' +
      '    "geometry": {\n' +
      '      "x": 12879178.72502107,\n' +
      '      "y": 7470965.153461802,\n' +
      '      "spatialReference": {\n' +
      '        "wkid": "3035"\n' +
      '      }\n' +
      '    },\n' +
      '    "attributes": {\n' +
      '      "name": "Dinagat Islands"\n' +
      '    }\n' +
      '  },\n' +
      '  {\n' +
      '    "geometry": {\n' +
      '      "x": 12879178.72502107,\n' +
      '      "y": 7470965.153461802,\n' +
      '      "spatialReference": {\n' +
      '        "wkid": "3035"\n' +
      '      }\n' +
      '    },\n' +
      '    "attributes": {\n' +
      '      "name": "Dinagat Islands"\n' +
      '    }\n' +
      '  }\n' +
      ']',
  })
  @ValidateNested({ each: true })
  @Type(() => EsriJsonDto)
  @IsNotEmpty()
  @IsArray()
  input: EsriJsonDto[];
}
