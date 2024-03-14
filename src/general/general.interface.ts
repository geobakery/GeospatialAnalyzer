import { GeoJSONFeatureCollectionDto } from './dto/geo-json.dto';

export interface GeneralResponse {
  response: string;
}
export interface ErrorResponse {
  status: number;
  error: string;
}

export interface DBResponse {
  response: GeoJSONFeatureCollectionDto;
  id: string;
  topic: string;
}

/**
 * Update notice:
 * Please update {@link GeneralService.checkTopicDefinition} corresponding to topicDefinition
 */
export type topicDefinition = {
  identifiers: string[];
  title: string;
  description?: string;
  __attributes__?: string[];
  __supports__?: string[];
} & ({ __source__: Source } | { __multipleSources__: Source[] });

export interface topicDefinitionOutside {
  identifiers: string[];
  title: string;
  description?: string;
  supports?: string[];
}

export interface SupportedTopics {
  intersect: topicDefinitionOutside[];
  within: topicDefinitionOutside[];
  nearestNeighbour: topicDefinitionOutside[];
  valuesAtPoint: topicDefinitionOutside[];
}

export interface tempResult {
  result: GeoJSONFeatureCollectionDto;
  parameter: any;
  id: string;
  topic: string;
}

export interface Source {
  /** The (possibly schema-qualified) name of the database relation. */
  source: string;
  /** A human-readable name to identify the source by. */
  name: string;
  /** The spatial reference system identifier used by this source. */
  srid: number;
}

export interface SqlLiteral {
  bindingName: string;
  value: string | number;
  sqlAlias: string;
}
