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
}

export interface topicDefinition {
  identifiers: string[];
  title: string;
  description?: string;
  __source__: string;
  __attributes__?: string[];
  __supports__?: string[];
  __multipleSources__?: multipleSource[];
}

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
}

export interface multipleSource {
  source: string;
  name: string;
}

export interface SqlLiteral {
  bindingName: string;
  value: string | number;
  sqlAlias: string;
}
