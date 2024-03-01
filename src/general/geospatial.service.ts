import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { TransformService } from '../transform/transform.service';
import { DbAdapterService } from './db-adapter.service';
import { EsriJsonDto } from './dto/esri-json.dto';
import { GeoJSONFeatureDto } from './dto/geo-json.dto';
import { SqlLiteral } from './general.interface';
import {
  GeneralService,
  GeospatialLogicalRequest,
  GeospatialRequest,
  GeospatialResultEntity,
} from './general.service';

@Injectable()
export abstract class GeospatialService<T extends GeospatialRequest> {
  protected adapter: DbAdapterService = this.generalService.getDbAdapter();

  protected constructor(
    protected dataSource: DataSource,
    protected generalService: GeneralService,
    protected transformService: TransformService,
  ) {}

  /**
   * Computes the result features for the given geospatial query.
   *
   * Wraps the common behavior of all geospatial query endpoints, invoking
   * {@link handleLogicalRequest} for the endpoint-specific calculations.
   *
   * **Subclasses should not override this method.**
   */
  public async handleRequest(
    request: T,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    await this.generalService.dynamicValidation(request.topics);

    const features = this.transformService.normalizeInputGeometries(
      request.inputGeometries,
    );

    const queries = [];
    const params = {};

    for (const [featureIndex, feature] of features.entries()) {
      for (const [topicIndex, topic] of request.topics.entries()) {
        const queryBuilder = this.#getQueryBuilderStart(
          request.returnGeometry,
          featureIndex,
          topicIndex,
          topic,
          feature,
        );

        this.handleLogicalRequest(
          queryBuilder,
          {
            feature,
            featureIndex,
            fieldsToQuery:
              this.generalService.identifierAllowedAttributesMap.get(topic),
            topic,
            topicIndex,
          },
          request,
        );

        queries.push(queryBuilder.getQuery());
        Object.assign(params, queryBuilder.getParameters());
      }
    }

    const query = '((' + queries.join(') UNION ALL (') + '))';
    const qb = this.dataSource
      .createQueryBuilder()
      .select('*')
      .from<GeospatialResultEntity>(query, 'union_query')
      .setParameters(params);

    return this.generalService.calculateMethode(request, qb);
  }

  /**
   * Adds endpoint-specific `from` and `where` clauses to `queryBuilder` for the given logical request.
   *
   * There are some requirements that are not expressed in code as of now:
   * - The result GeoJSON feature is constructed from the {@link DbAdapterService.getJsonRecordAlias}
   *   table alias. Ensure an appropriate `from` clause is added.
   * - Variable bindings can be used but their names must be unique. The
   *   `logicalRequest`'s indexes can be used as discriminators.
   */
  protected abstract handleLogicalRequest(
    queryBuilder: SelectQueryBuilder<GeospatialResultEntity>,
    logicalRequest: GeospatialLogicalRequest,
    request: T,
  ): void;

  /**
   * Creates the static SELECT ID as id, TOPIC as topic Part of the query
   */
  #getQueryBuilderStart(
    returnGeometry: boolean,
    featureIndex: number,
    topicIndex: number,
    topic: string,
    feature: GeoJSONFeatureDto,
  ) {
    const geoId = this.generalService.getAndSetGeoID(feature, featureIndex);
    const qb: SelectQueryBuilder<GeospatialResultEntity> =
      this.dataSource.createQueryBuilder();

    const literals: SqlLiteral[] = [
      {
        bindingName: `_topic_name_${topicIndex}`,
        value: topic,
        sqlAlias: 'topic',
      },
      {
        bindingName: `_feature_id_${featureIndex}`,
        value: geoId,
        sqlAlias: 'id',
      },
    ];

    // metadata
    literals.forEach((literal) => {
      qb.setParameter(literal.bindingName, literal.value);
      qb.addSelect(`:${literal.bindingName}`, literal.sqlAlias);
    });

    // GeoJSON FeatureCollection
    qb.addSelect(this.adapter.getJsonStructure(returnGeometry), 'response');

    return qb;
  }
}
