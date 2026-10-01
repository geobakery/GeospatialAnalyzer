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

  /**
   * The line is interpolated into evenly spaced sample points (`segmentLength` apart),
   * grouped into chunks of `pointsPerChunk` consecutive points.
   *
   * The raster gets clipped by the bounding boxes of each chunk.
   * To reduce its runtime, the original raster gets prevously clipped by the bounding box
   * of the whole line. Then `ST_Value` is evaluated for each Point, but only in the raster,
   * clipped by its chunk.
   *
   * Points whose chunk raster has no data at their location (e.g. outside the
   * raster's actual coverage) yield `height: null` instead of failing.
   */

  override getLineHeightProfile(
    feature: SqlParameter,
    interpolationDistance: SqlParameter,
    pointsPerChunk: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
  ): string {
    const lineInRasterCrs = `ST_Transform(${feature.value}::text, ${srid})`;

    return `(
    WITH line AS MATERIALIZED (
      SELECT
        ${feature.value}::geography AS geom_geog,
        ${lineInRasterCrs} AS geom,
        ST_Length(${feature.value}::geography) AS length
    ),
    line_corridor AS MATERIALIZED (
      SELECT
        geom,
        ST_Buffer(
          geom,
          ${interpolationDistance.value} / 2.0
        ) AS corridor
      FROM line
    ),
    clipped_line_raster AS MATERIALIZED (
      SELECT
        ST_Union(
          ST_Clip(
            "${sourceAlias}".rast,
            line_corridor.corridor,
            true,
            true
          )
        ) AS rast
      FROM line_corridor
      JOIN ${sourceTable} "${sourceAlias}"
        ON ST_Intersects(
          "${sourceAlias}".rast,
          line_corridor.corridor
        )
    ),
    sample_points AS MATERIALIZED (
      SELECT
        i AS idx,
        (i / ${pointsPerChunk.value})::int AS chunk_id,
        ST_Transform(
          ST_LineInterpolatePoint(
            ST_LineMerge(line.geom_geog::geometry),
            CASE
              WHEN i = 0 THEN 0
              WHEN i = point_count THEN 1
              ELSE (i * ${interpolationDistance.value}) / line.length
            END
          )::text,
          ${srid}
        ) AS pt
      FROM line
      CROSS JOIN LATERAL (
        SELECT
          i,
          CEIL(
            line.length / ${interpolationDistance.value}
          )::int AS point_count
        FROM generate_series(
          0,
          CEIL(line.length / ${interpolationDistance.value})::int
        ) AS i
      ) points
    ),
    group_bbox AS MATERIALIZED (
      SELECT
        chunk_id,
        ST_Expand(
          ST_Envelope(ST_Collect(pt)),
          ${interpolationDistance.value} / 2.0
        ) AS bbox
      FROM sample_points
      GROUP BY chunk_id
    ),
    clipped_chunk_raster AS MATERIALIZED (
      SELECT
        group_bbox.chunk_id,
        ST_Clip(
          clipped_line_raster.rast,
          group_bbox.bbox,
          true,
          true
        ) AS rast
      FROM group_bbox
      CROSS JOIN clipped_line_raster
      WHERE clipped_line_raster.rast IS NOT NULL
    )
    SELECT json_build_object(
      'min', MIN(height),
      'max', MAX(height),
      'mean', ROUND(AVG(height)::numeric, 2),
      'points', json_agg(
        json_build_object(
          'index', idx,
          'height', height
        ) ORDER BY idx
      )
    )
    FROM (
      SELECT
        sample_points.idx,
        CASE
          WHEN ST_Intersects(
            sample_points.pt,
            clipped_chunk_raster.rast
          )
          THEN ST_Value(
            clipped_chunk_raster.rast,
            sample_points.pt
          )
          ELSE NULL
        END AS height
      FROM sample_points
      JOIN clipped_chunk_raster
        ON clipped_chunk_raster.chunk_id = sample_points.chunk_id
    ) points
  )`;
  }

  override getPolygonHeightStats(
    feature: SqlParameter,
    sourceTable: string,
    sourceAlias: string,
    srid: number,
  ): string {
    const polygonInRasterCrs = `ST_Transform(${feature.value}::text, ${srid})`;

    return `(
      WITH candidate_tiles AS MATERIALIZED (
        SELECT rast
        FROM ${sourceTable} "${sourceAlias}"
        WHERE ST_Intersects("${sourceAlias}".rast, ${polygonInRasterCrs})
      ),
      merged AS MATERIALIZED (
        SELECT ST_Union(rast) AS rast FROM candidate_tiles
      ),
      clipped AS MATERIALIZED (
        SELECT ST_Clip(merged.rast, ${polygonInRasterCrs}, true, true) AS rast
        FROM merged
      ),
      stats AS (
        SELECT (ST_SummaryStats(clipped.rast)).*
        FROM clipped
      )
      SELECT json_build_object(
        'count', stats.count,
        'min', stats.min,
        'max', stats.max,
        'sum', ROUND(stats.sum::numeric, 2),
        'mean', ROUND(stats.mean::numeric, 2),
        'stddev', ROUND(stats.stddev::numeric, 3)
      )
      FROM stats
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
