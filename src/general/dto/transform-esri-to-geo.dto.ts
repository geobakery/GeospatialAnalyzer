import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EsriJsonDto } from './esri-json.dto';

export class TransformEsriToGeoDto {
  @ApiProperty({
    type: [EsriJsonDto],
    example: [
      {
        geometry: {
          x: 12879178.72502107,
          y: 7470965.153461802,
          spatialReference: {
            wkid: '3035',
          },
        },
        attributes: {
          name: 'Dinagat Islands',
        },
      },
      {
        geometry: {
          x: 12879178.72502107,
          y: 7470965.153461802,
          spatialReference: {
            wkid: '3035',
          },
        },
        attributes: {
          name: 'Dinagat Islands',
        },
      },
    ],
  })
  @Type(() => EsriJsonDto)
  input: EsriJsonDto[];
}
