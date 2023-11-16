import { GeoJSON } from 'typeorm';

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
