import { Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { IntersectParameterDto } from '../general/dto/parameter.dto';
import {
  DB_GEOMETRY_NAME,
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
export class IntersectService extends GeospatialService<IntersectParameterDto> {
  constructor(
    dataSource: DataSource,
    generalService: GeneralService,
    transformService: TransformService,
  ) {
    super(dataSource, generalService, transformService);
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'intersect',
    );
  }

  protected override handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const { fieldsToQuery, topic, feature, featureIndex } = logicalRequest;

    const topicSource = this.generalService.getSourceForIdentifier(topic);

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      // Notice: the geometry field is needed for filtering in the where condition
      if (!fieldsToQuery.includes(DB_GEOMETRY_NAME)) {
        subQuery.addSelect(DB_GEOMETRY_NAME);
      }
      subQuery.from(topicSource.source, topic);
      return subQuery;
    }, this.adapter.getJsonRecordAlias());

    const featureIntersect = this.getFeatureIntersectString(
      queryBuilder,
      topicSource.srid,
      feature,
      featureIndex,
    );
    queryBuilder.andWhere(featureIntersect);
  }

  private getFeatureIntersectString(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    // GeoJSON RFC7946: A Feature object's geometry member may be null (section
    // 3.2), but a Geometry object itself may never be null (section 3.1).
    const featureWkt =
      feature.geometry !== null
        ? geojsonToWKT(feature.geometry)
        : 'POINT EMPTY';

    // setup for left and right side of intersect
    queryStart.setParameter(
      `${QUERY_FEATURE_INDEX}${featureIndex}`,
      STANDARD_SRID + featureWkt,
    );
    const queryFeature = this.adapter.transformFeature(
      { raw: true, value: `:${QUERY_FEATURE_INDEX}${featureIndex}` },
      srid,
    );

    // intersect call
    return this.adapter.areFeaturesIntersecting(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_GEOMETRY_NAME },
    );
  }
}
