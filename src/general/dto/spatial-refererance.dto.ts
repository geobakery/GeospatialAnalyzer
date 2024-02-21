import { ApiProperty } from '@nestjs/swagger';

export class SpatialRefereranceDto {
  @ApiProperty({
    minLength: 1,
  })
  wkid: string;
}
