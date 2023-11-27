import { IsArray, IsNotEmpty } from 'class-validator';
import { SpatialRefereranceDto } from './spatial-refererance.dto';
import { ApiProperty } from '@nestjs/swagger';

export class EsriGeometryDto {
  @ApiProperty()
  x: number;

  @ApiProperty()
  y: number;

  @ApiProperty()
  z: number;

  @ApiProperty()
  m: number;

  @ApiProperty()
  @IsArray()
  paths: number[];

  @ApiProperty()
  @IsArray()
  rings: number[];

  @ApiProperty()
  @IsArray()
  points: number[];

  @ApiProperty()
  @IsNotEmpty()
  spatialReference: SpatialRefereranceDto;
}
