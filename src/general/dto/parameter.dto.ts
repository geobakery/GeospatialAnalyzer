import { Geometry } from 'typeorm';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { outputFormatEnum, TOPICS } from '../general.constants';

export class ParameterDto {
  //https://github.com/typestack/class-validator#validation-decorators
  @IsNotEmpty()
  @IsIn(TOPICS)
  topics: string[];
  @IsNotEmpty()
  inputGeometries: Geometry[];
  @IsOptional()
  @IsEnum(outputFormatEnum)
  outputFormat: string;
  @IsOptional()
  returnGeometry: boolean;
  @IsOptional()
  @IsInt()
  count: number;
  @IsOptional()
  maxDistanceToNeighbour: number;
  @IsOptional()
  outSRS: string;
  @IsOptional()
  timeout: number;
}
