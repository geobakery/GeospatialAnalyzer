import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { DbAdapterService, SqlParameter } from '../db-adapter.service';

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

  override transformFeature(featureWkt: SqlParameter, toCrs: number): string {
    return `ST_TRANSFORM(${featureWkt.value}::text, ${toCrs})`;
  }

  override getJsonStructure(returnGeometry: boolean): string {
    return returnGeometry
      ? `json_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(ST_AsGeoJSON(${this.getJsonRecordAlias()}.*)::jsonb))
     `
      : `json_build_object(
      'type', 'FeatureCollection',
      'features', jsonb_agg(jsonb_set(
         ST_AsGeoJSON(${this.getJsonRecordAlias()}.*)::jsonb,
         '{geometry}',
         'null'
      )))
     `;
  }

  override getJsonRecordAlias(): string {
    return 'custom_from_select';
  }

  override injectGeometryField(qb: SelectQueryBuilder<unknown>): void {
    qb.setParameter('dummyWkt', 'POINT EMPTY').addSelect(
      ':dummyWkt::geometry',
      'geom',
    );
  }

  override unionAll(queries: string[]): string {
    return '((' + queries.join(') UNION ALL (') + '))';
  }
}
