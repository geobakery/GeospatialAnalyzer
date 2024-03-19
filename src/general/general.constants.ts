import { HttpStatus } from '@nestjs/common';

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

export const DB_DIST_NAME = '__dist';

export const DB_FEATURE_ID_NAME = 'id';

export const DB_GEOMETRY_NAME = 'geom';

export const DB_HEIGHT_NAME = '__height';
export const DB_JSON_STRUCTURE_NAME = 'response';

export const DB_NAME_NAME = '__name';

export const DB_RASTER_DATA_NAME = 'rast';
export const DB_TOPIC_NAME = 'topic';

export const QUERY_FEATURE_INDEX = 'feature_wkt_';

/**
 * Choosing an appropriate status code is surprisingly unclear:
 * - "408 Request Timeout" is the most prominent option, but should be
 *   sent by the server if the client fails to transmit the request
 *   fast enough, not the other way round.
 * - "413 Content Too Large" might be a good option if we consider not
 *   only the request entity's byte size but also its "semantic size"
 *   (if that expression even makes sense).
 * - "422 Unprocessable Content" comes closes to our situation:
 *   "I know what you want, but I am unable to help you". However, it
 *   is a 4XX status, so even if the error is only temporary, e.g. due
 *   to high load, clients are implied not to repeat the request.
 * - 500, 503 or 504 might be appropriate, considering that *we* are
 *   unable to process the request fast enough. However, they imply
 *   that the situation is temporary and somewhat easily fixable.
 */
export const HTTP_STATUS_SQL_TIMEOUT = HttpStatus.UNPROCESSABLE_ENTITY;
