import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

export interface SqlParameter {
  raw: true; //Important: if raw should be changed to a real boolean value, there could be a risk of a sql injection
  value: string;
}

@Injectable()
/**
 * @TODO TypeORM provides a somewhat hidden `Raw()`-helper function to build
 *       expressions (maybe only in WHERE clauses?) while still allowing easy
 *       parametrization. This might greatly simplify/tidy up some of the
 *       methods here.
 * @see https://typeorm.io/find-options#advanced-options Callback-style "Raw" examples
 */
export abstract class DbAdapterService {
  abstract areFeaturesIntersecting(
    feature: SqlParameter,
    other: SqlParameter,
  ): string;

  abstract isFeatureWithin(inner: SqlParameter, outer: SqlParameter): string;

  abstract getFeatureDistance(
    feature: SqlParameter,
    other: SqlParameter,
  ): string;

  abstract getValueAtFeature(point: SqlParameter, raster: SqlParameter): string;

  abstract transformFeature(featureWkt: SqlParameter, toCrs: number): string;

  abstract getJsonStructure(returnGeometry: boolean): string;

  abstract getJsonRecordAlias(): string;

  abstract injectDummyWKTStringToQuery(qb: SelectQueryBuilder<unknown>): void;
}
