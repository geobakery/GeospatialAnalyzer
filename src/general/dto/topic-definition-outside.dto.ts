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

  @ApiProperty({
    example: ['name', 'art', 'geometrieflaeche'],
    required: false,
  })
  attributes?: string[];

  @ApiPropertyOptional({
    example: { unit: 'm', verticalDatum: 'DHHN2016' },
    required: false,
    description:
      'Unit and vertical datum for topic values. Top-level `unit` / `verticalDatum` are topic-wide defaults. For topics with multiple sources, per-source overrides appear in `sources[]` keyed by `sourceName` (matches the `__name` property in feature responses). Per-entry fields override the topic-level defaults field-by-field. All fields are independently optional.',
  })
  valueMetadata?: {
    unit?: string;
    verticalDatum?: string;
    sources?: Array<{
      sourceName: string;
      unit?: string;
      verticalDatum?: string;
    }>;
  };
}
