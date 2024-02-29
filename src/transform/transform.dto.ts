import { ApiProperty } from '@nestjs/swagger';
import { GeoJSON } from 'typeorm';
import { EsriJSON } from '../general/general.interface';

export class TransformDto {
  @ApiProperty()
  inputGeometries: any[];

  @ApiProperty()
  outputFormat: number;

  @ApiProperty()
  outSRS: string;
}
