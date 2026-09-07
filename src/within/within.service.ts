import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { WithinParameterDto } from '../general/dto/parameter.dto';
import {
  DB_GEOMETRY_NAME,
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
    const { fieldsToQuery, topic, feature, featureIndex, buffer } = logicalRequest;

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

    const featureWithin = this.getFeatureWithinString(
      queryBuilder,
      topicSource.srid,
      feature,
      featureIndex,
      buffer,
    );
    queryBuilder.andWhere(featureWithin);
  }

  private getFeatureWithinString(
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
    return this.adapter.isFeatureWithin(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_GEOMETRY_NAME },
    );
  }
}
