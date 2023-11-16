export const TOPICS = ['verw_land_f', 'verw_kreis_f', 'verw_gem_f'];

export enum topic {
  land = 'verw_land_f',
  kreis = 'verw_kreis_f',
  gemeinde = 'verw_gem_f',
}
export enum outputFormatEnum {
  geojson = 'geojson',
  esrijson = 'esrijson',
}
export const geojsonToPostGis = new Map<string, string>([
  ['Point', 'POINT'],
  ['LineString', 'LINESTRING'],
  ['Polygon', 'POLYGON'],
]);

export const DB_LIMIT = 100;
export const QUERY_TABLE_NAME = 'table1';
export const QUERY_SELECT =
  'json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(table1.*)::json)\n" +
  '  ) as response';

export const QUERY_PARAMETER_LENGTH = 2;
export const QUERY_ARRAY_POSITION = 0;
export const PARAMETER_ARRAY_POSITION = 1;
