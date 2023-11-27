import { IsNotEmpty } from 'class-validator';
import { EsriGeometryDto } from './esri-geometry.dto';
import { ApiProperty } from '@nestjs/swagger';

export class EsriJsonDto {
  @ApiProperty()
  @IsNotEmpty()
  geometry: EsriGeometryDto;

  @ApiProperty()
  @IsNotEmpty()
  attributes: object;
}
