export enum outputFormatEnum {
  geojson = 'geojson',
  esrijson = 'esrijson',
}
export const ARRAY_SEPERATOR_CONFIG = ', ';
export const DATABASE_NAME_CONFIG = 'database.db_name';
export const geojsonToPostGis = new Map<string, string>([
  ['Point', 'POINT'],
  ['LineString', 'LINESTRING'],
  ['Polygon', 'POLYGON'],
  ['GeometryCollection', 'GEOMETRYCOLLECTION'],
  ['MultiPoint', 'GEOMETRYCOLLECTION'],
  ['MultiLineString', 'GEOMETRYCOLLECTION'],
  ['MultiPolygon', 'GEOMETRYCOLLECTION'],
]);

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
