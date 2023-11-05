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
