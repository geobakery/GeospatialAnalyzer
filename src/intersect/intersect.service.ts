import { Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  QUERY_FEATURE_INDEX,
  QUERY_TOPIC,
  STANDARD_SRID,
  TOPIC_ID,
} from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import {
  GeneralService,
  GeospatialLogicalRequest,
} from '../general/general.service';
import { GeospatialService } from '../general/geospatial.service';
import { TransformService } from '../transform/transform.service';

@Injectable()
export class IntersectService extends GeospatialService<ParameterDto> {
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
    const { fieldsToQuery, topicIndex, topic, feature, featureIndex } =
      logicalRequest;

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      // TODO remove topic call => replace in postProcessor to build output-json
      subQuery.setParameter(`${QUERY_TOPIC}${topicIndex}`, topic);
      subQuery.addSelect(`:${QUERY_TOPIC}${topicIndex}`, TOPIC_ID);
      // Notice: geom is needed for filtering in the where condition
      if (!fieldsToQuery.includes('geom')) {
        subQuery.addSelect('geom');
      }
      subQuery.from(this.generalService.getDBNameForIdentifier(topic), topic);
      return subQuery;
    }, this.adapter.getJsonRecordAlias());

    const featureIntersect = this.getFeatureIntersectString(
      queryBuilder,
      feature,
      featureIndex,
    );
    queryBuilder.andWhere(featureIntersect);
  }

  private getFeatureIntersectString(
    queryStart: SelectQueryBuilder<unknown>,
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
      this.generalService.database_srid,
    );
    const dbFeature = 'geom';

    // intersect call
    return this.adapter.areFeaturesIntersecting(
      { raw: true, value: queryFeature },
      { raw: true, value: dbFeature },
    );
  }
}
