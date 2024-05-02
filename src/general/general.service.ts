import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueryFailedError, SelectQueryBuilder } from 'typeorm';
import { TransformService } from '../transform/transform.service';
import { PostgresService } from './adapter/postgres.service';
import { DbAdapterService } from './db-adapter.service';
import { EsriJsonDto } from './dto/esri-json.dto';
import {
  GeoJSONFeatureCollectionDto,
  GeoJSONFeatureDto,
} from './dto/geo-json.dto';
import {
  ESRIJSON_PARAMETER,
  GEOJSON_PARAMETER,
  HTTP_STATUS_SQL_TIMEOUT,
  STANDARD_CRS,
  supportedDatabase,
} from './general.constants';
import {
  DBResponse,
  Source,
  SpatialMetadata,
  SupportedTopics,
  tempResult,
  topicDefinition,
  topicDefinitionOutside,
} from './general.interface';

@Injectable()
export class GeneralService {
  adapter: DbAdapterService = this.getDbAdapter();
  topicsArray: string[] = [];
  identifierSourceMap: Map<string, Source> = new Map<string, Source>();
  identifierAllowedAttributesMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  identifierMultipleSourcesMap: Map<string, Source[]> = new Map<
    string,
    Source[]
  >();
  methodeTopicSupport: SupportedTopics = {
    intersect: [],
    within: [],
    nearestNeighbour: [],
    valuesAtPoint: [],
  };

  constructor(
    private configService: ConfigService,
    private transformService: TransformService,
  ) {
    /**
     * Explanation:
     * in the constructor we will set all dynamic settings from the env file.
     * This will be done once at the start of the service
     */
    const configurationFromTopicJson: unknown =
      this.configService.get('__topicsConfig__');
    const check = this.checkTopicDefinition(configurationFromTopicJson);
    if (!check) {
      throw new InternalServerErrorException(
        `Topic.json is deprecated. Administration needs to update the definition.`,
      );
    }
    this._setDynamicTopicsConfigurations(configurationFromTopicJson);
  }

  private isObject(x: unknown): x is object {
    try {
      return '' in (x as object) || true;
    } catch (e) {
      return false;
    }
  }

  private checkTopicDefinition(
    topicArray: unknown,
  ): topicArray is topicDefinition[] {
    return (
      Array.isArray(topicArray) &&
      topicArray.every((t: unknown): t is topicDefinition => {
        if (!this.isObject(t)) {
          return false;
        }

        // check mandatory values
        if (!Array.isArray((t as topicDefinition).identifiers)) {
          return false;
        }
        if (!(typeof (t as topicDefinition).title === 'string')) {
          return false;
        }

        // check source object
        const checkSource = (s: unknown): s is Source => {
          return (
            typeof (s as Source).source == 'string' &&
            typeof (s as Source).name == 'string' &&
            typeof (s as Source).srid == 'number'
          );
        };

        if ('__source__' in t) {
          return checkSource(
            (t as topicDefinition & { __source__: unknown }).__source__,
          );
        } else if ('__multipleSources__' in t) {
          const sources = (
            t as topicDefinition & { __multipleSources__: unknown }
          ).__multipleSources__;
          return (
            Array.isArray(sources) &&
            sources.every((s: unknown) => checkSource(s))
          );
        } else {
          return false;
        }
      })
    );
  }

  getDbAdapter(): DbAdapterService {
    if (this.adapter) {
      return this.adapter;
    }
    const dbtype = process.env.geospatial_analyzer_db_type;
    if (dbtype) {
      switch (dbtype) {
        case supportedDatabase.postgres: {
          return new PostgresService();
        }
        default: {
          throw new Error(`Unsupported database type: ${dbtype}`);
        }
      }
    }
  }

  getAllTopicsInformation(): topicDefinitionOutside[] {
    const allTopics: topicDefinitionOutside[] = [];

    // Go through all topics and add them to the results list
    Object.values(this.methodeTopicSupport).forEach((topics) => {
      allTopics.push(...topics);
    });

    // Error handling when no topics are found
    if (allTopics.length === 0) {
      throw new HttpException(
        'No topics found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return allTopics;
  }

  getTopicsInformationForOutsideSpecific(
    methode: keyof SupportedTopics,
  ): topicDefinitionOutside[] {
    const supportedTopics = this.methodeTopicSupport[methode];
    if (supportedTopics && supportedTopics.length) {
      return supportedTopics;
    }
    throw new HttpException(
      'Malformed topics configuration',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  _setDynamicTopicsConfigurations(td: topicDefinition[]) {
    if (!td.length) {
      // error handling ?
      console.error('No topic definition set');
      return;
    }

    td.forEach((t) => {
      const definition = {
        identifiers: t.identifiers,
        title: t.title,
        description: t.description,
        supports: t.__supports__,
      } as topicDefinitionOutside;

      Object.entries(this.methodeTopicSupport).forEach(([key, value]) => {
        if (!t.__supports__.length) {
          value.push(definition);
        } else if (t.__supports__.includes(key)) {
          value.push(definition);
        }
      });

      for (const identifier of t.identifiers) {
        this.topicsArray.push(identifier);

        if ('__source__' in t) {
          this.identifierSourceMap.set(identifier, t.__source__);
        }
        if ('__multipleSources__' in t) {
          this.identifierMultipleSourcesMap.set(
            identifier,
            t.__multipleSources__,
          );
        }

        if (t.__attributes__) {
          this.identifierAllowedAttributesMap.set(identifier, t.__attributes__);
        } else {
          this.identifierAllowedAttributesMap.set(identifier, ['*']);
        }
      }
    });
  }

  getTopics(): string[] {
    return this.topicsArray;
  }

  checkTopics(topics: string[]): boolean {
    return !!topics.every((val) => this.topicsArray.includes(val));
  }

  /**
   * Explanation:
   * Check if the dynamic service settings are set correctly
   * Improvement: Only once at the start and not on every start up
   */
  async dynamicValidation(topics: string[]): Promise<boolean> {
    if (this.checkTopics(topics)) {
      if (topics.every((t) => this.topicsArray.includes(t))) {
        return Promise.resolve(true);
      } else {
        throw new HttpException(
          'Malformed database configuration in topics',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    if (this.getTopics()) {
      throw new HttpException(
        'Unsupported topic. Supported topics are: ' +
          this.getTopics().join(', '),
        HttpStatus.BAD_REQUEST,
      );
    }
    throw new HttpException(
      'Unsupported topics. No topics were found.',
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Explanation:
   * the database response has the attribute "response". Inside the response attribute is the defined geojson structure.
   */
  dbToGeoJSON(response: DBResponse[]): tempResult[] {
    const result = [] as tempResult[];
    if (response.length) {
      response.forEach((r) => {
        result.push({
          result: r.response,
          id: r.id,
          topic: r.topic,
          parameter: {},
        });
      });
      return result;
    } else {
      throw new HttpException(
        'Unexpected formate error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Explanation:
   * Checks if the ID of the single geo feature if set and generates otherwise
   */
  getAndSetGeoID(geo: GeoJSONFeatureDto, index: number): string {
    if (geo.properties?.__geometryIdentifier__) {
      return geo.properties.__geometryIdentifier__;
    }

    if (!geo.properties) {
      geo.properties = {};
    }
    geo.properties.__geometryIdentifier__ = '__ID_' + index;

    return geo.properties.__geometryIdentifier__;
  }

  /**
   * Explanation:
   * Adds the user input and geometry properties in the response for the user
   */
  addUserInputToResponse(
    tmpResult: tempResult[],
    requestParams: Pick<
      GeospatialRequest,
      'outputFormat' | 'outSRS' | 'returnGeometry'
    >,
    map: Map<string, Record<string, unknown>>,
  ): void {
    if (!tmpResult?.length) {
      return;
    }
    tmpResult.forEach((result) => {
      const geo = result.result;
      const features = geo.features;
      if (!features?.length) {
        const props: SpatialMetadata = {
          NO_RESULT: 'No result to request',
          __topic: result.topic,
          __requestParams: requestParams,
          __geoProperties: map.get(result.id),
        };

        geo.features = [
          {
            type: 'Feature',
            properties: props,
            geometry: null,
          },
        ];
        return;
      } else {
        features.forEach((feature) => {
          feature.properties.__requestParams = requestParams;
          feature.properties.__geoProperties = map.get(result.id);
          feature.properties.__topic = result.topic;
        });
      }
    });
  }

  getSourceForIdentifier(top: string): Source {
    return this.identifierSourceMap.get(top);
  }

  getMultipleDBNamesForIdentifier(top: string): Source[] {
    return this.identifierMultipleSourcesMap.get(top) ?? [];
  }

  prepareDBResponse(
    query: any,
    requestParams: Pick<
      GeospatialRequest,
      'outputFormat' | 'outSRS' | 'returnGeometry'
    >,
    map: Map<string, Record<string, unknown>>,
  ): EsriJsonDto[] | GeoJSONFeatureDto[] {
    const result = this.dbToGeoJSON(query);
    this.addUserInputToResponse(result, requestParams, map);

    const features = result.flatMap((r) => r.result.features);

    if (requestParams.outputFormat === ESRIJSON_PARAMETER) {
      return this.transformService.convertGeoJSONToEsriJSON({
        input: features,
        epsg: requestParams.outSRS || STANDARD_CRS,
      });
    }

    if (requestParams.outputFormat === GEOJSON_PARAMETER) {
      return this.transformService.transformIncorrectCRSGeoJsonArray(features);
    }

    return features;
  }

  /**
   * Explanation:
   * Function which prepares the user's input for the actual database query and which return the actual result
   * This function is used as the wrapper for all geometry-like interfaces
   */
  async calculateMethode(
    args: GeospatialRequest,
    qb: SelectQueryBuilder<GeospatialResultEntity>,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    try {
      return await this.generelRoutine(args, qb);
    } catch (e: unknown) {
      // HttpExceptions are used for control flow, so we can simply forward them.
      if (e instanceof HttpException) {
        throw e;
      }

      if (e instanceof QueryFailedError && e.message === 'Query read timeout') {
        throw new HttpException(
          'The request cannot be processed in a timely manner',
          HTTP_STATUS_SQL_TIMEOUT,
        );
      }

      // Fallback: Any other error is unknown/unexpected, so a generic 500 must suffice.
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Explanation:
   * Function which prepares the user's input for the actual database query and which return the actual result
   * This function is used as the wrapper for all geometry-like interfaces
   */
  async generelRoutine(
    args: GeospatialRequest,
    qb: SelectQueryBuilder<GeospatialResultEntity>,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    await this.dynamicValidation(args.topics);

    const geoInput = this.transformService.normalizeInputGeometries(
      args.inputGeometries,
    );

    const dbResult = await qb.getRawMany<GeospatialResultEntity>();
    const requestParams = {
      outputFormat: args.outputFormat,
      outSRS: args.outSRS,
      returnGeometry: args.returnGeometry,
    };
    const idParameterMap = new Map(
      geoInput.map((geo, index) => [
        this.getAndSetGeoID(geo, index),
        geo.properties,
      ]),
    );

    const result = this.prepareDBResponse(
      dbResult,
      requestParams,
      idParameterMap,
    );
    if (!result.length) {
      throw new HttpException(
        'No result calculated!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }
}

export interface GeospatialResultEntity {
  id: string;
  response: GeoJSONFeatureCollectionDto;
  topic: string;
}

/**
 * Represents one individual request out of the `m * n` logical requests represented by a `GeospatialRequest` with `m` features and `n` topics.
 */
export interface GeospatialLogicalRequest {
  feature: GeoJSONFeatureDto;
  featureIndex: number;
  fieldsToQuery: string[];
  topic: string;
  topicIndex: number;
}

/**
 * Common parameters to the analytical endpoints.
 */
export interface GeospatialRequest {
  topics: string[];

  inputGeometries:
    | EsriJsonDto[]
    | GeoJSONFeatureDto[]
    | GeoJSONFeatureCollectionDto
    | GeoJSONFeatureCollectionDto[];

  outputFormat: string;

  outSRS: number;

  returnGeometry: boolean;
}
