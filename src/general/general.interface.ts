import { GeoJSON } from 'typeorm';
import { dbDirection, ReplaceStringType } from './general.constants';

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
  response: GeoJSON;
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
  whereStatementParameter?: string;
  limit?: number;
  count?: number;
  orderBy?: string;
  orderByDirection?: dbDirection;
}
