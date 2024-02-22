import { ApiProperty } from '@nestjs/swagger';

export class SpatialReferenceDto {
  @ApiProperty()
  wkid: number;
}
