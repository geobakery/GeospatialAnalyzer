import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EsriJsonDto } from './esri-json.dto';

export class TransformEsriToGeoDto {
  @ApiProperty({
    type: [EsriJsonDto],
    example: [
      {
        geometry: {
          x: 417183.931568,
          y: 5652786.443955,
          spatialReference: {
            wkid: 25833,
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
