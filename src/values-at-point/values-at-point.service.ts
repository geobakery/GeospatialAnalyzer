import { Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ValuesAtPointParameterDto } from '../general/dto/parameter.dto';
import {
  DB_HEIGHT_NAME,
  DB_NAME_NAME,
  DB_RASTER_DATA_NAME,
  QUERY_FEATURE_INDEX,
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
export class ValuesAtPointService extends GeospatialService<ValuesAtPointParameterDto> {
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
    const { fieldsToQuery, topicIndex, feature, featureIndex } = logicalRequest;

    const sources = this.generalService.getMultipleDBNamesForIdentifier(
      logicalRequest.topic,
    );

    const params = {};
    const heightQueries = [];

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
      const heightQueryBuilder = queryBuilder
        .createQueryBuilder()
        .setParameter(topicSourceParameterName, source.name)
        .addSelect(`:${topicSourceParameterName}`, DB_NAME_NAME)
        .addSelect(featureValue, DB_HEIGHT_NAME)
        .from(source.source, source.name) // TypeORM demands an alias here, but we do not need any specific one.
        .andWhere(featureIntersect);

      this.adapter.injectGeometryField(heightQueryBuilder);

      fieldsToQuery.forEach((field) => heightQueryBuilder.addSelect(field));

      heightQueries.push(heightQueryBuilder.getQuery());
      Object.assign(params, heightQueryBuilder.getParameters());
    }
    queryBuilder.setParameters(params);
    queryBuilder.from(
      this.adapter.unionAll(heightQueries),
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
