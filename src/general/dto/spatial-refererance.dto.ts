import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SpatialRefereranceDto {
  @ApiProperty()
  @IsNotEmpty()
  wkid: string;
}
