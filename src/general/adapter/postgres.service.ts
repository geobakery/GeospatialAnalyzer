import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { DbAdapterService, SqlParameter } from '../db-adapter.service';
import { DB_GEOMETRY_NAME } from '../general.constants';

@Injectable()
export class PostgresService extends DbAdapterService {
  private clipTouchedArg = '';

  private roundValue(expression: string, decimalPlaces?: number): string {
    if (decimalPlaces === undefined) {
      return expression;
    }
    // The value ends up in the SQL text, so only a non-negative integer is allowed.
    if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
      throw new Error(
        `decimalPlaces must be an integer >= 0, got ${decimalPlaces}`,
      );
    }
    return `ROUND((${expression})::numeric, ${decimalPlaces})`;
  }

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
    decimalPlaces?: number,
  ): string {
    return this.roundValue(
      `ST_Value(${raster.value}, ${point.value})`,
      decimalPlaces,
    );
  }

  /**
   * The line is interpolated into evenly spaced sample points
   * (`interpolationDistance` meters apart, measured geodetically, always
   * including start and end). For each point the value is read from the tile
   * that contains it, found via the spatial index of the source table.
   *
   * Points without raster coverage yield `height: null`.
   */

  override getLineValueProfile(
    feature: SqlParameter,
    interpolationDistance: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
    decimalPlaces?: number,
  ): string {
    const lineGeometry = `ST_LineMerge(${feature.value}::geometry)`;

    return `(
      WITH line AS MATERIALIZED (
        SELECT ${lineGeometry} AS geom
      ),
      line_parts AS MATERIALIZED (
        SELECT
          d.path AS part_path,
          d.geom AS geom
        FROM line
        CROSS JOIN LATERAL ST_Dump(line.geom) AS d
      ),
      vertices AS MATERIALIZED (
        SELECT
          lp.part_path,
          (p).path[1] AS vertex_idx,
          (p).geom AS pt
        FROM line_parts lp
        CROSS JOIN LATERAL ST_DumpPoints(lp.geom) AS p
      ),
      segment_vertices AS MATERIALIZED (
        SELECT
          part_path,
          vertex_idx,
          pt AS start_pt,
          LEAD(pt) OVER (
            PARTITION BY part_path
            ORDER BY vertex_idx
          ) AS end_pt
        FROM vertices
      ),
      segments_base AS MATERIALIZED (
        SELECT
          part_path,
          vertex_idx,
          ST_MakeLine(start_pt, end_pt) AS geom,
          ST_Length(
            ST_MakeLine(start_pt, end_pt)::geography
          ) AS length
        FROM segment_vertices
        WHERE end_pt IS NOT NULL
      ),
      segments AS MATERIALIZED (
        SELECT
          part_path,
          vertex_idx,
          geom,
          length,
          COALESCE(
            SUM(length) OVER (
              PARTITION BY part_path
              ORDER BY vertex_idx
              ROWS BETWEEN UNBOUNDED PRECEDING
                AND 1 PRECEDING
            ),
            0
          ) AS distance_before
        FROM segments_base
        WHERE length > 0
      ),
      segment_samples AS MATERIALIZED (
        SELECT
          s.part_path,
          s.vertex_idx,
          points.i AS sample_idx,
          (
            points.i = 0
            OR points.i = points.point_count
          ) AS is_vertex,
          s.distance_before
            + CASE
                WHEN points.i = points.point_count
                  THEN s.length
                ELSE points.i::double precision
                  * ${interpolationDistance.value}
              END AS distance_from_start,
          ST_Transform(
            ST_LineInterpolatePoint(
              s.geom,
              CASE
                WHEN points.i = points.point_count
                  THEN 1.0
                ELSE
                  (
                    points.i::double precision
                    * ${interpolationDistance.value}
                  ) / s.length
              END
            ),
            ${srid}
          ) AS pt
        FROM segments s
        CROSS JOIN LATERAL (
          SELECT
            i,
            CEIL(
              s.length / ${interpolationDistance.value}
            )::int AS point_count
          FROM generate_series(
            0,
            CEIL(
              s.length / ${interpolationDistance.value}
            )::int
          ) AS i
        ) points
        WHERE
          s.length > 0
          AND (
            points.i > 0
            OR s.vertex_idx = 1
          )
      ),
      sample_points AS MATERIALIZED (
        SELECT
          ROW_NUMBER() OVER (
            ORDER BY part_path, vertex_idx, sample_idx
          ) - 1 AS idx,
          is_vertex,
          distance_from_start,
          pt
        FROM segment_samples
      ),
      point_values AS MATERIALIZED (
        SELECT
          sp.idx,
          sp.is_vertex,
          sp.distance_from_start,
          sp.pt AS geom,
          ST_Value(
            "${sourceAlias}".rast,
            sp.pt
          ) AS value
        FROM sample_points sp
        LEFT JOIN ${sourceTable} "${sourceAlias}"
          ON ST_Intersects(
            "${sourceAlias}".rast,
            sp.pt
          )
      )
      SELECT json_build_object(
        'heightStats', json_build_object(
          'points_count', COUNT(*),
          'points_haveValue', COUNT(value),
          'points_noValue', COUNT(*)-COUNT(value),
          'min', ${this.roundValue('MIN(value)', decimalPlaces)},
          'max', ${this.roundValue('MAX(value)', decimalPlaces)},
          'sum', ${this.roundValue('SUM(value)', decimalPlaces)},
          'mean', ${this.roundValue('AVG(value)', decimalPlaces)},
          'stddev', ${this.roundValue('STDDEV(value)', decimalPlaces === undefined ? undefined : decimalPlaces + 1)}
        ),
        'profilePoints', json_agg(
          json_build_object(
            'index', idx,
            'height', ${this.roundValue('value', decimalPlaces)},
            'isVertex', is_vertex,
            'chainageMeters', ROUND(distance_from_start::numeric, 2)
          )
          ORDER BY idx
        )
      )
      FROM point_values
    )`;
  }

  override getPolygonValueStats(
    feature: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
    decimalPlaces?: number,
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
        'pixel_haveValue',  (stats).count,
        'min', ${this.roundValue('(stats).min', decimalPlaces)},
        'max', ${this.roundValue('(stats).max', decimalPlaces)},
        'sum', ${this.roundValue('(stats).sum', decimalPlaces)},
        'mean', ${this.roundValue('(stats).mean', decimalPlaces)},
        'stddev', ${this.roundValue('(stats).stddev', decimalPlaces === undefined ? undefined : decimalPlaces + 1)}
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
