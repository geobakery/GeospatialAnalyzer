import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { TransformService } from '../transform/transform.service';
import { DbAdapterService } from './db-adapter.service';
import { EsriJsonDto } from './dto/esri-json.dto';
import { GeoJSONFeatureDto } from './dto/geo-json.dto';
import {
  DB_FEATURE_ID_NAME,
  DB_JSON_STRUCTURE_NAME,
  DB_TOPIC_NAME,
  QUERY_FEATURE_INDEX,
  QUERY_BUFFER_INDEX,
} from './general.constants';
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
    const bufferQueries = [];
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
            buffer: request.buffer,
          },
          request,
        );

        queries.push(queryBuilder.getQuery());
        Object.assign(params, queryBuilder.getParameters());
      }
      if (
        request.returnBufferGeometry === true &&
        request.buffer !== undefined &&
        request.buffer > 0
      ) {
        const bufferQueryBuilder = this.dataSource.createQueryBuilder().from('(SELECT 1)', 'buffer_source');

        const bufferGeometry = this.getBufferGeometry(bufferQueryBuilder, feature, featureIndex, request.buffer,);

        const bufferDistanceParameter = `${QUERY_BUFFER_INDEX}output_${featureIndex}`;

        bufferQueryBuilder
          .select(`'__BUFFER_${featureIndex}'`, DB_FEATURE_ID_NAME,)
          .addSelect(`'__BUFFER__'`, DB_TOPIC_NAME,)
          .addSelect(this.adapter.getBufferJsonStructure(bufferGeometry,`:${bufferDistanceParameter}`,),
            DB_JSON_STRUCTURE_NAME,
          );

        bufferQueries.push(bufferQueryBuilder.getQuery(),);
        Object.assign(params, bufferQueryBuilder.getParameters(),
        );
      }

    }

    const allQueries = [
      ...queries,
      ...bufferQueries,
    ];

    const qb = this.dataSource
      .createQueryBuilder()
      .select('*')
      .from<GeospatialResultEntity>(
        this.adapter.unionAll(allQueries),
        'union_query',
      )
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
        sqlAlias: DB_TOPIC_NAME,
      },
      {
        bindingName: `_feature_id_${featureIndex}`,
        value: geoId,
        sqlAlias: DB_FEATURE_ID_NAME,
      },
    ];

    // metadata
    literals.forEach((literal) => {
      qb.setParameter(literal.bindingName, literal.value);
      qb.addSelect(`:${literal.bindingName}`, literal.sqlAlias);
    });

    // GeoJSON FeatureCollection
    qb.addSelect(
      this.adapter.getJsonStructure(returnGeometry),
      DB_JSON_STRUCTURE_NAME,
    );

    return qb;
  }
  protected getInputGeometry(
    queryBuilder: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
  ): string {
    const featureParameter = `${QUERY_FEATURE_INDEX}${featureIndex}`;

    queryBuilder.setParameter(
      featureParameter,
      JSON.stringify(feature.geometry),
    );

    return this.adapter.transformFeature(
      {
        raw: true,
        value: `ST_GeomFromGeoJSON(:${featureParameter})`,
      },
      srid,
    );
  }
  protected getAnalysisGeometry(
    queryBuilder: SelectQueryBuilder<unknown>,
    srid: number,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
    buffer?: number,
  ): string {
    let queryFeature = this.getInputGeometry(
      queryBuilder,
      srid,
      feature,
      featureIndex,
    );

    if (buffer !== undefined && buffer > 0) {
      const bufferParameter = `${QUERY_BUFFER_INDEX}${featureIndex}`;

      queryBuilder.setParameter(
        bufferParameter,
        buffer,
      );

      queryFeature = this.adapter.bufferFeature(
        {
          raw: true,
          value: queryFeature,
        },
        {
          raw: true,
          value: `:${bufferParameter}`,
        },
        srid
      );
    }

    return queryFeature;
  }

  private getBufferQuadSegs(bufferDistance: number): number {
    const maxError = 0.1;
    const minQuadSegs = 8;
    const maxQuadSegs = 256;

    if (bufferDistance <= 0) {
      return minQuadSegs;
    }

    const quadSegs = Math.ceil(
      Math.PI /
        (4 * Math.acos(1 - maxError / bufferDistance)),
    );

    return Math.min(maxQuadSegs,Math.max(minQuadSegs, quadSegs),
    );
  }

  protected getBufferGeometry(
    queryBuilder: SelectQueryBuilder<unknown>,
    feature: GeoJSONFeatureDto,
    featureIndex: number,
    buffer?: number,
  ): string {
    if (buffer === undefined || buffer <= 0) {
      return undefined;
    }

    const inputGeometry = this.getInputGeometry(queryBuilder,4326,feature,featureIndex);

    const bufferParameter =`${QUERY_BUFFER_INDEX}output_${featureIndex}`;

    queryBuilder.setParameter(bufferParameter, buffer);

    return this.adapter.bufferFeature(
      {
        raw: true,
        value: inputGeometry,
      },
      {
        raw: true,
        value: `:${bufferParameter}`,
      },
      4326
    );
  }
}
