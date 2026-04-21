import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TopicDefinitionOutsideDto {
  @ApiProperty({ example: ['sn_kreis_f', 'kreis_f'] })
  identifiers: string[];

  @ApiProperty({ example: 'Landkreise/Kreise' })
  title: string;

  @ApiProperty({
    example: 'Landkreise und kreisfreie Städte in Sachsen.',
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

  @ApiPropertyOptional({
    example: [{ name: 'GeoSN' }],
    required: false,
    description:
      'Attribution for the data source(s). A de-duplicated list of data providers used by this topic, each with optional `name` and `url`. For topics with multiple sources, entries are unioned across all sources. Source-specific attribution is additionally available on feature responses via the `__attribution` property.',
  })
  attribution?: Array<{ name?: string; url?: string }>;
}
