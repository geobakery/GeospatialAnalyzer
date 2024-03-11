import { Injectable } from '@nestjs/common';
import { geojsonToWKT } from '@terraformer/wkt';
import { DataSource, LessThanOrEqual, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  DB_DIST_NAME,
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
export class NearestNeighbourService extends GeospatialService<ParameterDto> {
  constructor(
    dataSource: DataSource,
    generalService: GeneralService,
    transformService: TransformService,
  ) {
    super(dataSource, generalService, transformService);
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'nearestNeighbour',
    );
  }

  protected override handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<unknown>,
    logicalRequest: GeospatialLogicalRequest,
    request: ParameterDto,
  ): void {
    const { fieldsToQuery, topicIndex, topic, feature, featureIndex } =
      logicalRequest;

    const topicSource = this.generalService.getSourceForIdentifier(topic);

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      // TODO remove topic call => replace in postProcessor to build output-json
      subQuery.setParameter(`${QUERY_TOPIC}${topicIndex}`, topic);
      subQuery.addSelect(`:${QUERY_TOPIC}${topicIndex}`, TOPIC_ID);
      // Notice: geom is needed to calculate the distance
      if (!fieldsToQuery.includes('geom')) {
        subQuery.addSelect('geom');
      }
      const featureDistanceString = this.getFeatureDistanceString(
        queryBuilder,
        topicSource.srid,
        feature,
        featureIndex,
      );
      subQuery
        // TODO constante (maybe __dist could be a keyword ??)
        .addSelect(featureDistanceString, DB_DIST_NAME)
        .from(topicSource.source, topic)
        .orderBy(DB_DIST_NAME)
        .limit(request.count);

      return subQuery;
    }, this.adapter.getJsonRecordAlias());

    if (request.maxDistanceToNeighbour) {
      queryBuilder.andWhere({
        [DB_DIST_NAME]: LessThanOrEqual(request.maxDistanceToNeighbour),
      });
    }
  }

  private getFeatureDistanceString(
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
    return this.adapter.getFeatureDistance(
      { raw: true, value: queryFeature },
      { raw: true, value: dbFeature },
    );
  }
}
