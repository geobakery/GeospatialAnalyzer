import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    example: 'm',
    required: false,
    description:
      'Optional unit for topic values. This takes precedence over `__valueMetadata__.unit`.',
  })
  unit?: string;

  @ApiPropertyOptional({
    example: 'DHHN2016',
    required: false,
    description:
      'Optional vertical datum for topic values. This takes precedence over `__valueMetadata__.verticalDatum`.',
  })
  verticalDatum?: string;

  @ApiPropertyOptional({
    example: { unit: 'm', verticalDatum: 'DHHN2016' },
    required: false,
    description:
      'Optional, used only when top-level `unit`/`verticalDatum` are not set.',
  })
  __valueMetadata__?: { unit?: string; verticalDatum?: string };
}
