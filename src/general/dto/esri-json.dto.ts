import { IsNotEmpty, ValidateNested } from 'class-validator';
import { EsriGeometryDto } from './esri-geometry.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class EsriJsonDto {
  @ApiProperty()
  @ValidateNested()
  @Type(() => EsriGeometryDto)
  @IsNotEmpty()
  geometry: EsriGeometryDto;

  @ApiProperty()
  @IsNotEmpty()
  attributes: object;
}
