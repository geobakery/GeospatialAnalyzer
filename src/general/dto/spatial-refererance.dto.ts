import { ApiProperty } from '@nestjs/swagger';

export class SpatialRefereranceDto {
  @ApiProperty()
  wkid: number;
}
