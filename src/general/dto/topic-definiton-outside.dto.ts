import { ApiProperty } from '@nestjs/swagger';

export class TopicDefinitonOutsideDto {
  @ApiProperty({ example: 'verwaltung_landkreise_id' })
  identifier: string;
  @ApiProperty({ example: 'Verwaltung Landkreise' })
  title: string;
  @ApiProperty({ example: 'Verwaltung der Landkreise in Sachsen' })
  description?: string;
  @ApiProperty({ example: ['intersect', 'within', 'nearestNeighbour'] })
  supports?: string[];
}
