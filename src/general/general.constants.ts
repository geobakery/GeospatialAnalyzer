export enum outputFormatEnum {
  geojson = 'geojson',
  esrijson = 'esrijson',
}
export enum supportedDatabase {
  postgres = 'postgres',
}

export const GEOJSON_PARAMETER = 'geojson';
export const ESRIJSON_PARAMETER = 'esrijson';

export const STANDARD_CRS = 4326;
export const STANDARD_EPSG = 'EPSG:';
export const STANDARD_SRID = 'SRID=' + STANDARD_CRS + ';';
export const STANDARD_CRS_STRING = 'EPSG:4326';

export const GEO_IDENTIFIER = '__geometryIdentifier__';
export const GEO_PARAMETER = '__geoProperties';
export const REQUESTPARAMS = '__requestParams';

export const DB_DIST_NAME = '__dist';

export const QUERY_FEATURE_INDEX = 'feature_wkt_';
export const TOPIC_ID = '__topic';
export const QUERY_TOPIC = 'topic_';
