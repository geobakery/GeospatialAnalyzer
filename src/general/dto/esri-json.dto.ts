import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EsriGeometryDto } from './esri-geometry.dto';

@ApiExtraModels(EsriGeometryDto)
export class EsriJsonDto {
  @ApiProperty()
  @Type(() => EsriGeometryDto)
  geometry: EsriGeometryDto;

  @ApiProperty()
  attributes: object;
}
