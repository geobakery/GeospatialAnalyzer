import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { DbAdapterService, SqlParameter } from '../db-adapter.service';
import { DB_GEOMETRY_NAME } from '../general.constants';

@Injectable()
export class PostgresService extends DbAdapterService {
  override areFeaturesIntersecting(
    feature: SqlParameter,
    other: SqlParameter,
  ): string {
    return `ST_intersects(${feature.value}, ${other.value})`;
  }

  override isFeatureWithin(inner: SqlParameter, outer: SqlParameter): string {
    return `ST_within(${inner.value}, ${outer.value})`;
  }

  override getFeatureDistance(
    feature: SqlParameter,
    other: SqlParameter,
  ): string {
    return `ST_distance(${feature.value}, ${other.value})`;
  }

  override getValueAtFeature(
    point: SqlParameter,
    raster: SqlParameter,
  ): string {
    return `ST_value(${raster.value}, ${point.value})`;
  }

  override getLineHeightProfile(
    feature: SqlParameter,
    segmentLength: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
  ): string {
    const lineInRasterCrs = `ST_Transform(${feature.value}::text, ${srid})`;

    return `( 
        WITH candidate_tiles AS MATERIALIZED ( 
          SELECT rast 
          FROM ${sourceTable} "${sourceAlias}" 
          WHERE ST_Intersects("${sourceAlias}".rast, ${lineInRasterCrs}) 
        ), 
        line AS MATERIALIZED (
          SELECT ${feature.value}::geography AS geom, ST_Length(${feature.value}::geography) AS length 
        ), 
        sample_points AS MATERIALIZED (
          SELECT n AS idx, ST_Transform(
            ST_LineInterpolatePoint(
              ST_LineMerge(line.geom::geometry),
                CASE
                  WHEN n = 0 THEN 0
                  WHEN n = point_count THEN 1
                  ELSE (n * ${segmentLength.value}) / line.length
                END
              )::text, ${srid}
            ) AS pt
          FROM line
          CROSS JOIN LATERAL (
            SELECT n, CEIL(line.length / ${segmentLength.value})::int AS point_count
            FROM generate_series(
              0,
              CEIL(line.length / ${segmentLength.value})::int
            ) AS n
          ) points
        )
        SELECT json_build_object(
          'min', MIN(height),
          'max', MAX(height),
          'avg', AVG(height), 
          'points', json_agg( json_build_object( 'index', idx, 'height', height ) ORDER BY idx )
        ) 
        FROM (
          SELECT DISTINCT ON (sample_points.idx)
            sample_points.idx,
            ST_Value(candidate_tiles.rast, sample_points.pt) AS height
          FROM sample_points
          JOIN candidate_tiles
            ON ST_Intersects(sample_points.pt, candidate_tiles.rast)
          ORDER BY sample_points.idx
        ) points
      )`;
  }

  override transformFeature(featureWkt: SqlParameter, toCrs: number): string {
    return `ST_TRANSFORM(${featureWkt.value}::text, ${toCrs})`;
  }

  override getJsonStructure(returnGeometry: boolean): string {
    const recordValue = returnGeometry
      ? `ST_AsGeoJSON(
          CASE 
            WHEN ST_IsEmpty(${this.getJsonRecordAlias()}.${DB_GEOMETRY_NAME}) 
            THEN ${this.getJsonRecordAlias()}.${DB_GEOMETRY_NAME}
            ELSE ST_Transform(${this.getJsonRecordAlias()}.${DB_GEOMETRY_NAME}, 4326)
          END
        )::jsonb`
      : "'null'";

    return `json_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(
        jsonb_set(
          ST_AsGeoJSON(${this.getJsonRecordAlias()}.*)::jsonb,
          '{geometry}',
          ${recordValue}
        )
      ))
    `;
  }

  override getJsonRecordAlias(): string {
    return 'custom_from_select';
  }

  override injectGeometryField(qb: SelectQueryBuilder<unknown>): void {
    qb.setParameter('dummyWkt', 'POINT EMPTY').addSelect(
      ':dummyWkt::geometry',
      DB_GEOMETRY_NAME,
    );
  }

  override unionAll(queries: string[]): string {
    return '((' + queries.join(') UNION ALL (') + '))';
  }
}
