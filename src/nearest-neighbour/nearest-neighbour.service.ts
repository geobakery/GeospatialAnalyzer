import { Injectable } from '@nestjs/common';
import { DataSource, LessThanOrEqual, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { NearestNeighbourParameterDto } from '../general/dto/parameter.dto';
import { DB_DIST_NAME, DB_GEOMETRY_NAME } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import {
  GeneralService,
  GeospatialLogicalRequest,
} from '../general/general.service';
import { GeospatialService } from '../general/geospatial.service';
import { TransformService } from '../transform/transform.service';

@Injectable()
export class NearestNeighbourService extends GeospatialService<NearestNeighbourParameterDto> {
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
    request: NearestNeighbourParameterDto,
  ): void {
    const { fieldsToQuery, topic, feature, featureIndex, buffer } =
      logicalRequest;

    const topicSource = this.generalService.getSourceForIdentifier(topic);

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      // Notice: the geometry field is needed to calculate the distance
      if (!fieldsToQuery.includes(DB_GEOMETRY_NAME)) {
        subQuery.addSelect(DB_GEOMETRY_NAME);
      }
      const featureDistanceString = this.getFeatureDistanceString(
        queryBuilder,
        topicSource.srid,
        feature,
        featureIndex,
        buffer,
      );
      subQuery
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
    buffer?: number,
  ): string {
    const queryFeature = this.getAnalysisGeometry(
      queryStart,
      srid,
      feature,
      featureIndex,
      buffer,
    );

    // Within call
    return this.adapter.getFeatureDistance(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_GEOMETRY_NAME },
    );
  }
}
