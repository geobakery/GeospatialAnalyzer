import { ApiProperty } from '@nestjs/swagger';

export class TopicDefinitonOutsideDto {
  @ApiProperty({ example: ['verwaltung_landkreise_id'] })
  identifiers: string[];

  @ApiProperty({ example: 'Verwaltung Landkreise' })
  title: string;

  @ApiProperty({
    example: 'Verwaltung der Landkreise in Sachsen',
    required: false,
  })
  description?: string;

  @ApiProperty({
    example: ['intersect', 'within', 'nearestNeighbour'],
    required: false,
  })
  supports?: string[];
}
