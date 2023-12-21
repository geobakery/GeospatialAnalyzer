import { GeoJSON } from 'typeorm';
import { dbDirection, ReplaceStringType } from './general.constants';
import { GeoJsonDto } from './dto/geo-json.dto';

export interface Geometry {}
export interface EsriGeometry {}
export interface EsriJSON {
  geometry: EsriGeometry;
  symbol: NonNullable<object>;
  attributes: NonNullable<object>;
}
export interface ErrorResponse {
  status: number;
  error: string;
}

export interface DBResponse {
  response: GeoJsonDto;
}

export interface QueryAndParameter {
  query: string[];
  parameter: string[];
}

export interface CrsGeometryElementProperty {
  name: string;
}
export interface CrsGeometryElement {
  type: string;
  properties: CrsGeometryElementProperty;
}
export interface CrsGeometry {
  type: string;
  crs?: CrsGeometryElement;
  coordinates: any;
}

export interface dbRequestBuilderSample {
  select: boolean;
  where: boolean;
  from?: boolean;
  fromStatement?: string;
  fromStatementParameter?: Map<string, ReplaceStringType>;
  customStatement?: boolean;
  selectStatement?: string;
  selectStatementParameter?: string;
  whereStatement?: string;
  whereStatementParameter?: Map<string, ReplaceStringType>;
  limit?: number;
  count?: number;
  orderBy?: string;
  orderByDirection?: dbDirection;
}

export interface topicDefinition {
  identifier: string;
  title: string;
  description?: string;
  __source__: string;
  __attributes__?: string[];
  __supports__?: string[];
}

export interface topicDefinitionOutside {
  identifier: string;
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
