import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { DbAdapterService, SqlParameter } from '../db-adapter.service';
import { DB_GEOMETRY_NAME } from '../general.constants';

@Injectable()
export class PostgresService extends DbAdapterService {

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
