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
export const geojsonToPostGis = new Map<string, string>([['Point', 'POINT']]);

export const DB_LIMIT = 100;
export const QUERY_TABLE_NAME = 'table1';
export const QUERY_SELECT =
  'json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(table1.*)::json)\n" +
  '  ) as response';
