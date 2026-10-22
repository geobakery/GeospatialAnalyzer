import { Injectable, BadRequestException } from '@nestjs/common';
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
    const { fieldsToQuery, topic, feature, featureIndex } = logicalRequest;

    this.assertValidDistanceRange(request);
    this.assertPolygonForExclusionOptions(feature, request);

    const topicSource = this.generalService.getSourceForIdentifier(topic);
    const distanceExpression = this.getFeatureDistanceString(
      queryBuilder,
      topicSource.srid,
      feature,
      featureIndex,
    );

    queryBuilder.from((subQuery) => {
      fieldsToQuery.forEach((field) => subQuery.addSelect(field));
      if (!fieldsToQuery.includes(DB_GEOMETRY_NAME)) {
        subQuery.addSelect(DB_GEOMETRY_NAME);
      }
      subQuery
        .addSelect(distanceExpression, DB_DIST_NAME)
        .from(topicSource.source, topic);

      const exclusion = this.getExclusionCondition(
        queryBuilder,
        topicSource.srid,
        feature,
        featureIndex,
        request,
      );
      if (exclusion) {
        subQuery.andWhere(exclusion);
      }

      if (
        request.minDistanceToNeighbour !== undefined &&
        request.minDistanceToNeighbour > 0
      ) {
        subQuery.andWhere(`${distanceExpression} >= :minDistanceToNeighbour`, {
          minDistanceToNeighbour: request.minDistanceToNeighbour,
        });
      }

      return subQuery.orderBy(DB_DIST_NAME).limit(request.count);
    }, this.adapter.getJsonRecordAlias());

    if (request.maxDistanceToNeighbour) {
      queryBuilder.andWhere({
        [DB_DIST_NAME]: LessThanOrEqual(request.maxDistanceToNeighbour),
      });
    }
  }

  private getExclusionCondition(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
    request: NearestNeighbourParameterDto,
  ): string | undefined {
    if (
      !request.polygonExcludesInnerFeatures &&
      !request.polygonExcludesEntirelyInnerFeatures
    ) {
      return undefined;
    }
    const polygon = {
      raw: true as const,
      value: this.getInputGeometry(queryStart, srid, feature, featureIndex),
    };
    const other = { raw: true as const, value: DB_GEOMETRY_NAME };

    return request.polygonExcludesInnerFeatures
      ? this.adapter.hasNoPartInside(polygon, other)
      : this.adapter.isNotEntirelyInside(polygon, other);
  }

  private assertPolygonForExclusionOptions(
    feature: GeoJSONFeatureDto,
    request: NearestNeighbourParameterDto,
  ): void {
    if (
      !request.polygonExcludesInnerFeatures &&
      !request.polygonExcludesEntirelyInnerFeatures
    ) {
      return;
    }
    const geometryType: string | undefined = feature.geometry?.type;
    if (geometryType !== 'Polygon') {
      throw new BadRequestException(
        `polygonExcludesInnerFeatures and polygonExcludesEntirelyInnerFeatures can only be used with polygon input geometries, got ${geometryType ?? 'null'}`,
      );
    }
  }

  private assertValidDistanceRange(
    request: NearestNeighbourParameterDto,
  ): void {
    const min = request.minDistanceToNeighbour ?? 0;
    const max = request.maxDistanceToNeighbour;
    if (max && min >= max) {
      throw new BadRequestException(
        `minDistanceToNeighbour (${min}) must be less than maxDistanceToNeighbour (${max})`,
      );
    }
  }

  private getFeatureDistanceString(
    queryStart: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    const queryFeature = this.getAnalysisGeometry(
      queryStart,
      srid,
      feature,
      featureIndex,
    );

    // Within call
    return this.adapter.getFeatureDistance(
      { raw: true, value: queryFeature },
      { raw: true, value: DB_GEOMETRY_NAME },
    );
  }
}
