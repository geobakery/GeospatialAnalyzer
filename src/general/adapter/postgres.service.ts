import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { DbAdapterService, SqlParameter } from '../db-adapter.service';
import { DB_GEOMETRY_NAME } from '../general.constants';

@Injectable()
export class PostgresService extends DbAdapterService {
  private clipTouchedArg = '';

  override configureClipTouchedSupport(supported: boolean): void {
    this.clipTouchedArg = supported ? ', true' : '';
  }

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

  /**
   * The line is interpolated into evenly spaced sample points
   * (`interpolationDistance` meters apart, measured geodetically, always
   * including start and end). For each point the height is read from the tile
   * that contains it, found via the spatial index of the source table.
   *
   * Points without raster coverage yield `height: null`.
   */

  override getLineHeightProfile(
    feature: SqlParameter,
    interpolationDistance: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
  ): string {
    const lineInRasterCrs = `ST_Transform(${feature.value}::text, ${srid})`;

    return `(
      WITH line AS MATERIALIZED (
        SELECT
          ${lineInRasterCrs} AS geom,
          ST_Length(${feature.value}::geography) AS length
      ),
      sample_points AS MATERIALIZED (
        SELECT
          i AS idx,
          ST_LineInterpolatePoint(
            ST_LineMerge(line.geom),
            CASE
              WHEN i = 0 THEN 0
              WHEN i = point_count THEN 1
              ELSE (i * ${interpolationDistance.value}) / line.length
            END
          ) AS pt
        FROM line
        CROSS JOIN LATERAL (
          SELECT
            i,
            CEIL(line.length / ${interpolationDistance.value})::int AS point_count
          FROM generate_series(
            0,
            CEIL(line.length / ${interpolationDistance.value})::int
          ) AS i
        ) points
      ),
      point_heights AS MATERIALIZED (
        SELECT
          sample_points.idx,
          ST_Value(
            "${sourceAlias}".rast,
            sample_points.pt
          ) AS height
        FROM sample_points
        LEFT JOIN ${sourceTable} "${sourceAlias}"
          ON ST_Intersects(
            "${sourceAlias}".rast,
            sample_points.pt
          )
      )
      SELECT json_build_object(
        'min', MIN(height),
        'max', MAX(height),
        'mean', ROUND(AVG(height)::numeric, 2),
        'points', json_agg(json_build_object('index', idx,'height', height) ORDER BY idx)
      )
      FROM point_heights
    )`;
  }

  override getPolygonHeightStats(
    feature: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
  ): string {
    const polygon = `ST_Transform(${feature.value}::text, ${srid})`;

    return `(
      WITH polygon AS (
        SELECT ${polygon} AS geom
      ),
      stats AS (
        SELECT ST_SummaryStatsAgg(
          ST_Clip(
            "${sourceAlias}".rast,
            polygon.geom,
            true${this.clipTouchedArg}
          ),
          1,
          true
        ) AS stats
        FROM ${sourceTable} "${sourceAlias}"
        CROSS JOIN polygon
        WHERE ST_Intersects(
          "${sourceAlias}".rast,
          polygon.geom
        )
      )
      SELECT json_build_object(
        'count',  (stats).count,
        'min',    (stats).min,
        'max',    (stats).max,
        'sum',    ROUND((stats).sum::numeric, 2),
        'mean',   ROUND((stats).mean::numeric, 2),
        'stddev', ROUND((stats).stddev::numeric, 3)
      )
      FROM stats
    )`;
  }

  override transformFeature(featureWkt: SqlParameter, toCrs: number): string {
    return `ST_TRANSFORM(${featureWkt.value}::text, ${toCrs})`;
  }

  override bufferFeature(
    feature: SqlParameter,
    distance: SqlParameter,
    srid: number,
    quadSegs: number,
  ): string {
    return `ST_Transform(
              ST_Buffer(
                ST_Transform(${feature.value}, 4326)::geography,
              ${distance.value}, 'quad_segs=${quadSegs}')::geometry,
            ${srid})`;
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

  override getBufferJsonStructure(
    bufferGeometry: string,
    bufferDistance: string,
  ): string {
    return `
      json_build_object(
        'type', 'FeatureCollection',
        'features', json_build_array(
          json_build_object(
            'type', 'Feature',
            'geometry',
            ST_AsGeoJSON(${bufferGeometry})::json,
            'properties',
            json_build_object(
              '__buffer', true,
              '__bufferDistance', ${bufferDistance}
            )
          )
        )
      )
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
