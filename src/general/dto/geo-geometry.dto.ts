import { ApiProperty } from '@nestjs/swagger';

export class GeoGeometryDto {
  @ApiProperty()
  type: string;

  @ApiProperty({
    items: { nullable: true }, // As close as we can get to the any-type
    type: 'array',
  })
  coordinates: any[];
}
