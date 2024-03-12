import { Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { WithinParameterDto } from '../general/dto/parameter.dto';
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
export class WithinService extends GeospatialService<WithinParameterDto> {
  constructor(
    dataSource: DataSource,
    generalService: GeneralService,
    transformService: TransformService,
  ) {
    super(dataSource, generalService, transformService);
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific('within');
  }

  protected override handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
  ): void {
    const { fieldsToQuery, topicIndex, topic, feature, featureIndex } =
      logicalRequest;

    const topicSource = this.generalService.getSourceForIdentifier(topic);

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      // TODO remove topic call => replace in postProcessor to build output-json
      subQuery.setParameter(`${QUERY_TOPIC}${topicIndex}`, topic);
      subQuery.addSelect(`:${QUERY_TOPIC}${topicIndex}`, TOPIC_ID);
      // Notice: geom is needed for filtering in the where condition
      if (!fieldsToQuery.includes('geom')) {
        subQuery.addSelect('geom');
      }
      subQuery.from(topicSource.source, topic);
      return subQuery;
    }, this.adapter.getJsonRecordAlias());

    const featureWithin = this.getFeatureWithinString(
      queryBuilder,
      topicSource.srid,
      feature,
      featureIndex,
    );
    queryBuilder.andWhere(featureWithin);
  }

  private getFeatureWithinString(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    // setup for left and right side of Within
    queryStart.setParameter(
      `${QUERY_FEATURE_INDEX}${featureIndex}`,
      STANDARD_SRID + geojsonToWKT(feature.geometry),
    );
    const queryFeature = this.adapter.transformFeature(
      { raw: true, value: `:${QUERY_FEATURE_INDEX}${featureIndex}` },
      srid,
    );
    const dbFeature = 'geom';

    // Within call
    return this.adapter.isFeatureWithin(
      { raw: true, value: queryFeature },
      { raw: true, value: dbFeature },
    );
  }
}
