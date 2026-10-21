import { BadRequestException, Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ValuesAtGridParameterDto } from '../general/dto/parameter.dto';
import {
  DB_VALUE_NAME,
  DB_VALUE_PROFILE_NAME,
  DB_VALUE_STATS_NAME,
  SOURCE_NAME_PROPERTY,
  DB_RASTER_DATA_NAME,
  LINE_INTERPOLATION_DISTANCE_METERS,
  QUERY_FEATURE_INDEX,
  QUERY_INTERPOLATION_DISTANCE_INDEX,
  STANDARD_SRID,
} from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import {
  GeneralService,
  GeospatialLogicalRequest,
} from '../general/general.service';
import { GeospatialService } from '../general/geospatial.service';
import { TransformService } from '../transform/transform.service';

@Injectable()
export class ValuesAtGridService extends GeospatialService<ValuesAtGridParameterDto> {
  constructor(
    dataSource: DataSource,
    generalService: GeneralService,
    transformService: TransformService,
  ) {
    super(dataSource, generalService, transformService);
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'valuesAtPoint',
    );
  }

  protected override handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const geometryType = logicalRequest.feature.geometry?.type;

    if (geometryType === 'LineString') {
      this.handleLineStringRequest(queryBuilder, logicalRequest);
      return;
    }

    if (geometryType === 'Polygon') {
      this.handlePolygonRequest(queryBuilder, logicalRequest);
      return;
    }

    if (geometryType !== 'Point') {
      throw new BadRequestException(
        `valuesAtPoint currently supports Point, LineString and Polygon geometries, got "${geometryType}"`,
      );
    }

    this.handlePointRequest(queryBuilder, logicalRequest);
  }

  private handlePointRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const { fieldsToQuery, topicIndex, feature, featureIndex } = logicalRequest;

    const sources = this.generalService.getMultipleDBNamesForIdentifier(
      logicalRequest.topic,
    );

    const params = {};
    const valueQueries = [];

    for (const [sourceIndex, source] of sources.entries()) {
      const featureValue = this.getValueArRasterString(
        queryBuilder,
        source.srid,
        feature,
        featureIndex,
      );
      const featureIntersect = this.getFeatureIntersectString(
        queryBuilder,
        source.srid,
        feature,
        featureIndex,
      );

      const topicSourceParameterName = `topic_${topicIndex}_source_name_${sourceIndex}`;
      const valueQueryBuilder = queryBuilder
        .createQueryBuilder()
        .setParameter(topicSourceParameterName, source.name)
        .addSelect(`:${topicSourceParameterName}`, SOURCE_NAME_PROPERTY)
        .addSelect(featureValue, DB_VALUE_NAME)
        .from(source.source, source.name) // TypeORM demands an alias here, but we do not need any specific one.
        .andWhere(featureIntersect);

      this.adapter.injectGeometryField(valueQueryBuilder);

      fieldsToQuery.forEach((field) => valueQueryBuilder.addSelect(field));

      valueQueries.push(valueQueryBuilder.getQuery());
      Object.assign(params, valueQueryBuilder.getParameters());
    }
    queryBuilder.setParameters(params);
    queryBuilder.from(
      this.adapter.unionAll(valueQueries),
      this.adapter.getJsonRecordAlias(),
    );
  }

  private handleLineStringRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const { fieldsToQuery, topicIndex, feature, featureIndex } = logicalRequest;

    const sources = this.generalService.getMultipleDBNamesForIdentifier(
      logicalRequest.topic,
    );

    const params = {};
    const profileQueries = [];

    const featureParam = `${QUERY_FEATURE_INDEX}${featureIndex}`;
    queryBuilder.setParameter(
      featureParam,
      STANDARD_SRID + geojsonToWKT(feature.geometry),
    );
    const interpolationDistanceParam = `${QUERY_INTERPOLATION_DISTANCE_INDEX}${featureIndex}`;
    queryBuilder.setParameter(
      interpolationDistanceParam,
      LINE_INTERPOLATION_DISTANCE_METERS,
    );

    for (const [sourceIndex, source] of sources.entries()) {
      const profileExpr = this.adapter.getLineValueProfile(
        { raw: true, value: `:${featureParam}` },
        { raw: true, value: `:${interpolationDistanceParam}` },
        source.source,
        source.name,
        source.srid,
      );

      const topicSourceParameterName = `topic_${topicIndex}_source_name_${sourceIndex}`;
      const profileQueryBuilder = queryBuilder
        .createQueryBuilder()
        .from('(SELECT 1)', 'line_value_profile_source')
        .setParameter(topicSourceParameterName, source.name)
        .addSelect(`:${topicSourceParameterName}`, SOURCE_NAME_PROPERTY)
        .addSelect(profileExpr, DB_VALUE_PROFILE_NAME);

      this.adapter.injectGeometryField(profileQueryBuilder);
      fieldsToQuery.forEach((field) => profileQueryBuilder.addSelect(field));

      profileQueries.push(profileQueryBuilder.getQuery());
      Object.assign(params, profileQueryBuilder.getParameters());
    }
    queryBuilder.setParameters(params);
    queryBuilder.from(
      this.adapter.unionAll(profileQueries),
      this.adapter.getJsonRecordAlias(),
    );
  }

  private handlePolygonRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const { fieldsToQuery, topicIndex, feature, featureIndex } = logicalRequest;

    const sources = this.generalService.getMultipleDBNamesForIdentifier(
      logicalRequest.topic,
    );

    const params = {};
    const statsQueries = [];

    const featureParam = `${QUERY_FEATURE_INDEX}${featureIndex}`;
    queryBuilder.setParameter(
      featureParam,
      STANDARD_SRID + geojsonToWKT(feature.geometry),
    );

    for (const [sourceIndex, source] of sources.entries()) {
      const statsExpr = this.adapter.getPolygonValueStats(
        { raw: true, value: `:${featureParam}` },
        source.source,
        source.name,
        source.srid,
      );

      const topicSourceParameterName = `topic_${topicIndex}_source_name_${sourceIndex}`;
      const statsQueryBuilder = queryBuilder
        .createQueryBuilder()
        .from('(SELECT 1)', 'polygon_value_stats_source')
        .setParameter(topicSourceParameterName, source.name)
        .addSelect(`:${topicSourceParameterName}`, SOURCE_NAME_PROPERTY)
        .addSelect(statsExpr, DB_VALUE_STATS_NAME);

      this.adapter.injectGeometryField(statsQueryBuilder);
      fieldsToQuery.forEach((field) => statsQueryBuilder.addSelect(field));

      statsQueries.push(statsQueryBuilder.getQuery());
      Object.assign(params, statsQueryBuilder.getParameters());
    }
    queryBuilder.setParameters(params);
    queryBuilder.from(
      this.adapter.unionAll(statsQueries),
      this.adapter.getJsonRecordAlias(),
    );
  }

  private getValueArRasterString(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    // setup for left and right side of intersect
    queryStart.setParameter(
      `${QUERY_FEATURE_INDEX}${featureIndex}`,
      STANDARD_SRID + geojsonToWKT(feature.geometry),
    );
    const queryFeature = this.adapter.transformFeature(
      { raw: true, value: `:${QUERY_FEATURE_INDEX}${featureIndex}` },
      srid,
    );
    // intersect call
    return this.adapter.getValueAtFeature(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_RASTER_DATA_NAME },
    );
  }

  private getFeatureIntersectString(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    // setup for left and right side of intersect
    queryStart.setParameter(
      `${QUERY_FEATURE_INDEX}${featureIndex}`,
      STANDARD_SRID + geojsonToWKT(feature.geometry),
    );
    const queryFeature = this.adapter.transformFeature(
      { raw: true, value: `:${QUERY_FEATURE_INDEX}${featureIndex}` },
      srid,
    );

    // intersect call
    return this.adapter.areFeaturesIntersecting(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_RASTER_DATA_NAME },
    );
  }
}
