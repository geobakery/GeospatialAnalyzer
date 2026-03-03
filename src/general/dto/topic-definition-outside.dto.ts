import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicDefinitionOutsideDto {
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
    example: { unit: 'm', verticalDatum: 'DHHN2016' },
    required: false,
    description:
      'Unit and vertical datum at topic level. Used as fallback when individual sources do not provide their own metadata.',
  })
  __valueMetadata__?: { unit?: string; verticalDatum?: string };
}
