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
  ['GeometryCollection', 'GEOMETRYCOLLECTION'],
  ['MultiPoint', 'GEOMETRYCOLLECTION'],
  ['MultiLineString', 'GEOMETRYCOLLECTION'],
  ['MultiPolygon', 'GEOMETRYCOLLECTION'],
]);

export const DB_LIMIT = 100;
export const QUERY_TABLE_NAME = 'table1';
export const QUERY_SELECT =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  '  ) as response';

export const QUERY_PARAMETER_LENGTH = 2;
export const QUERY_ARRAY_POSITION = 0;
export const PARAMETER_ARRAY_POSITION = 1;

export const STANDARD_CRS = 4326;
export const DATABASE_CRS = 25833;

export const GEO_IDENTIFIER = '__geometryIdentifier__';
export const REQUESTPARAMS = '__requestParams';

export const EPSG_REGEX = /\d+$/g;

export enum dbDirection {
  asc = 'asc',
  desc = 'desc',
}

export enum ReplaceStringType {
  TABLE,
  COUNT,
  GEOMETRY,
}
