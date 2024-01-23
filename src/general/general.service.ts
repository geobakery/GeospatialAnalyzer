import { DataSource } from 'typeorm';
import {
  dbRequestBuilderSample,
  DBResponse,
  GeneralResponse,
  multipleSource,
  QueryAndParameter,
  SupportedTopics,
  tempResult,
  topicDefinition,
  topicDefinitionOutside,
} from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  ESRIJSON_PARAMETER,
  GEO_IDENTIFIER,
  GEO_PARAMETER,
  PARAMETER_ARRAY_POSITION,
  QUERY_ARRAY_POSITION,
  QUERY_PARAMETER_LENGTH,
  QUERY_SELECT,
  ReplaceStringType,
  REQUESTPARAMS,
  STANDARD_CRS,
  STANDARD_SRID,
} from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { ParameterDto } from './dto/parameter.dto';
import { ConfigService } from '@nestjs/config';
import { geojsonToWKT } from '@terraformer/wkt';
import { TransformService } from '../transform/transform.service';
import { GeoJsonDto } from './dto/geo-json.dto';
import { GeoGeometryDto } from './dto/geo-geometry.dto';
import { TransformEsriToGeoDto } from './dto/transform-esri-to-geo.dto';
import { EsriJsonDto } from './dto/esri-json.dto';
import { TransformGeoToEsriDto } from './dto/transform-geo-to-esri.dto';

@Injectable()
export class GeneralService {
  topicsArray: string[] = [];
  identifierSourceMap: Map<string, string> = new Map<string, string>();
  identifierAllowedAttributesMap: Map<string, string[]> = new Map<
    string,
    string[]
  >();
  identifierMultipleSourcesMap: Map<string, multipleSource[]> = new Map<
    string,
    multipleSource[]
  >();
  methodeTopicSupport: SupportedTopics = {
    intersect: [],
    within: [],
    nearestNeighbour: [],
    valuesAtPoint: [],
  };
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private configService: ConfigService,
    private transformService: TransformService,
  ) {
    /**
     * Explanation:
     * in the constructor we will set all dynamic settings from the env file.
     * This will be done once at the start of the service
     */
    const t = this.configService.get<topicDefinition[]>('__topicsConfig__');
    // TODO check if t is valid
    this._setDynamicTopicsConfigurations(t);
  }

  getTopicsInformationForOutsideSpecific(
    methode: string,
  ): topicDefinitionOutside[] {
    const supportedTopics = this.methodeTopicSupport[
      methode
    ] as topicDefinitionOutside[];
    if (supportedTopics && supportedTopics.length) {
      return supportedTopics;
    }
    throw new HttpException(
      'Malformed topics configuration',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  _setDynamicTopicsConfigurations(td: topicDefinition[]) {
    //TODO check if td is valid
    if (!td.length) {
      // error handling ?
      console.error('No topic definition set');
      return;
    }

    td.forEach((t) => {
      this.topicsArray.push(t.identifier);

      const definition = {
        identifier: t.identifier,
        title: t.title,
        description: t.description,
      } as topicDefinitionOutside;

      this.identifierSourceMap.set(t.identifier, t.__source__);
      if (t.__attributes__) {
        this.identifierAllowedAttributesMap.set(t.identifier, t.__attributes__);
      } else {
        this.identifierAllowedAttributesMap.set(t.identifier, ['*']);
      }
      if (t.__multipleSources__) {
        this.identifierMultipleSourcesMap.set(
          t.identifier,
          t.__multipleSources__,
        );
      }

      Object.entries(this.methodeTopicSupport).forEach(([key, value]) => {
        if (!t.__supports__.length) {
          value.push(definition);
        } else if (t.__supports__.includes(key)) {
          value.push(definition);
        }
      });
    });
  }

  getTopics(): string[] {
    return this.topicsArray;
  }

  checkTopics(args: ParameterDto): boolean {
    return !!args.topics.every((val) => this.topicsArray.includes(val));
  }

  /**
   * Explanation:
   * Check if the dynamic service settings are set correctly
   * Improvement: Only once at the start and not on every start up
   */
  async dynamicValidation(args: ParameterDto): Promise<boolean> {
    if (this.checkTopics(args)) {
      if (args.topics.every((t) => this.topicsArray.includes(t))) {
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
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException(
      'Unsupported topics. No topics were found.',
      HttpStatus.INTERNAL_SERVER_ERROR,
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
   * transform the geometry to the needed postgis formate
   * e.g.:'SRID=4326;POINT(411967 5659861)'::geometry
   */
  _buildGeometry(geo: GeoGeometryDto): string {
    const coordinates = geojsonToWKT(geo);
    return STANDARD_SRID + coordinates;
  }

  /**
   * Explanation:
   * Checks if the ID of the single geo feature if set and generates otherwise
   */
  getAndSetGeoID(geo: GeoJsonDto, index: number): string {
    if (
      geo.type === 'Feature' &&
      geo.properties &&
      geo.properties[GEO_IDENTIFIER]
    ) {
      return geo.properties[GEO_IDENTIFIER];
    }
    if (geo.type === 'Feature') {
      if (!geo.properties) {
        geo.properties = {};
      }
      geo.properties[GEO_IDENTIFIER] = '__ID_' + index;
      return geo.properties[GEO_IDENTIFIER];
    }
    return null;
  }

  /**
   * Explanation:
   * Adds the user input and geometry properties in the response for the user
   */
  addUserInputToResponse(
    tmpResult: tempResult[],
    requestParams: any,
    map: Map<string, any>,
  ): void {
    if (!tmpResult?.length) {
      return;
    }
    tmpResult.forEach((result) => {
      const geo = result.result;
      if (geo.type === 'FeatureCollection') {
        const features = geo.features;
        if (!features?.length) {
          const props = {
            NO_RESULT: 'No result to request',
          };
          props[REQUESTPARAMS] = requestParams;
          props[GEO_PARAMETER] = map.get(result.id);

          geo.features = [
            {
              type: 'Feature',
              properties: props,
            } as GeoJsonDto,
          ];
          return;
        } else {
          features.forEach((feature) => {
            feature.properties[REQUESTPARAMS] = requestParams;
            feature.properties[GEO_PARAMETER] = map.get(result.id);
          });
        }
      } else if (geo.type === 'Feature') {
        geo.properties[REQUESTPARAMS] = requestParams;
        geo.properties['test'] = map.get(result.id);
      }
    });
  }

  /**
   * Explanation:
   * collects which input parameter should be included in the response
   */
  setRequestParameterForResponse(args: ParameterDto): any {
    return {
      timeout: args.timeout,
      outputFormat: args.outputFormat,
      outSRS: args.outSRS,
      returnGeometry: args.returnGeometry,
    };
  }

  /**
   * Explanation:
   * assures that the result is always a GeoJSON[] formate
   */
  setGeoJSONArray(
    result: tempResult[],
    resultArray: any[], //GeoJsonDto[] | EsriJsonDto[],
    parameter: ParameterDto,
  ): any[] {
    const resultMap = result.map((r) => r.result);
    let resultElement: GeoJsonDto[] | EsriJsonDto[] = resultMap;
    if (parameter.outputFormat === ESRIJSON_PARAMETER) {
      if (result.length) {
        resultElement = this.transformService.convertGeoJSONToEsriJSON({
          input: resultMap,
          epsg: parameter.outSRS || STANDARD_CRS,
        } as TransformGeoToEsriDto);
      }
    }
    if (!resultArray.length) {
      resultArray = resultElement;
    } else {
      resultElement.forEach((r) => {
        if (r) {
          resultArray.push(r);
        }
      });
    }
    return resultArray;
  }

  getDBNameForIdentifier(top: string): string {
    return this.identifierSourceMap.get(top);
  }

  getMultipleDBNamesForIdentifier(top: string): multipleSource[] {
    return this.identifierMultipleSourcesMap.get(top);
  }

  /**
   * Explanation:
   * Creates a custom raw sql statement from given Parameter
   * TypeORM has an array formate of:
   * ['SQL string to execute with parameter $1 $2 $3',[Intparameter, Stringparameter, otherTypeParameter ]]
   */
  createRawQuery(
    dbBuilderParameter: dbRequestBuilderSample,
    top: string,
    geo: GeoJsonDto,
    args: ParameterDto,
  ): [string, any[]] {
    let result: string = '';
    if (dbBuilderParameter.selectStatement) {
      result += dbBuilderParameter.selectStatement;
    } else {
      result += QUERY_SELECT;
    }

    if (geo.type === 'Feature') {
      const props = geo.properties;
      const propsId = props[GEO_IDENTIFIER];
      const propsIdString =
        "SELECT '" + propsId + "' as id, '" + top + "' as topic, ";
      result = result.replace('SELECT', propsIdString);
    }

    // TODO ordentlicher :/
    if (!args.returnGeometry) {
      result = result.replace(
        'json_agg(ST_AsGeoJSON(customFromSelect.*)::json',
        "json_agg(ST_AsGeoJSON(customFromSelect.*)::jsonb - 'geometry'",
      );
    }
    if (dbBuilderParameter.fromStatement) {
      const replacedString = this._replaceHelper(
        dbBuilderParameter.fromStatementParameter,
        dbBuilderParameter.fromStatement,
        top,
        geo.geometry,
        args,
      );
      result += ' ' + replacedString;
    }
    if (dbBuilderParameter.whereStatementParameter?.size) {
      const replacedString = this._replaceHelper(
        dbBuilderParameter.whereStatementParameter,
        dbBuilderParameter.whereStatement,
        top,
        geo.geometry,
        args,
      );

      result += ' ' + replacedString;
    }
    return [result, []];
  }

  /**
   * Explanation:
   * Helperfunction to replace place marker in string for their true value
   * e.g.: "SELECT * from __a" => [__a => "tablename1"] => ""SELECT * from tablename1"
   */
  _replaceHelper(
    statementParameter: Map<string, ReplaceStringType>,
    parameterString: string,
    top: string,
    geo: GeoGeometryDto,
    args: ParameterDto,
  ): string {
    if (!statementParameter.size) {
      return '';
    }

    let replacedString = parameterString;
    const sources = this.getMultipleDBNamesForIdentifier(top);
    statementParameter.forEach((value, key) => {
      switch (value) {
        case ReplaceStringType.TABLE: {
          const table = this.getDBNameForIdentifier(top);
          replacedString = replacedString.replace(key, table);
          break;
        }
        case ReplaceStringType.GEOMETRY: {
          const geoString = this._buildGeometry(geo);
          replacedString = replacedString.replace(key, geoString);
          break;
        }
        case ReplaceStringType.COUNT: {
          if (args.count) {
            const countElement = String(args.count);
            replacedString = replacedString.replace(key, countElement);
          }
          break;
        }
        case ReplaceStringType.ATTRIBUTE: {
          let attr = 'ST_Transform(geom,' + STANDARD_CRS + ') as geom';
          const topicAttributes = this.identifierAllowedAttributesMap.get(top);
          if (topicAttributes.length) {
            topicAttributes.forEach((a) => {
              attr += ',' + a;
            });
          }
          attr += ',' + "'" + top + "' as __topic";
          replacedString = replacedString.replace(key, attr);
          break;
        }
        case ReplaceStringType.MULTIPLE_TABLES: {
          let attr = '';
          if (sources && sources.length) {
            sources.forEach((s) => {
              attr += s.source + ',';
            });
            attr = attr.slice(0, -1); // remove last comma
          }
          replacedString = replacedString.replace(key, attr);
          break;
        }
        case ReplaceStringType.MULTIPLE_SOURCE_RAST_DATA: {
          let attr = '';
          if (sources && sources.length) {
            const geoString = this._buildGeometry(geo);
            sources.forEach((s) => {
              attr +=
                'ST_VALUE(ST_Transform(' +
                s.source +
                '.rast,' +
                STANDARD_CRS +
                "), '" +
                geoString +
                "'::geometry) as " +
                s.name +
                ',';
            });
            attr = attr.slice(0, -1); // remove last comma
          }
          // "ST_VALUE(ST_Transform(hr.rast,4326), 'SRID=4326;POINT (13.6645492 51.0639403)'::geometry) as __height_r,\n" +
          //   "ST_VALUE(ST_Transform(dom.rast,4326), 'SRID=4326;POINT (13.6645492 51.0639403)'::geometry) as __height_dom_r";
          replacedString = replacedString.replace(key, attr);
          break;
        }
      }
    });
    return replacedString;
  }

  /*
  Creates a single query for typeOrm (query as string, parameter as array)
   */
  async createSelectQueries(
    service: any,
    top: string,
    geo: GeoJsonDto,
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<[string, any[]]> {
    // To replace Repositories, we only create raw sql statements
    if (dbBuilderParameter.customStatement) {
      return service.createRawQuery(dbBuilderParameter, top, geo, args);
    }

    throw new HttpException(
      'Unsupported route parameter configuration',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  /**
  Collect all single Queries and put their data together
   */
  async collectQueries(
    args: ParameterDto,
    geo: GeoJsonDto,
    dbBuilderParameter: dbRequestBuilderSample,
    customFunction: (
      service: any,
      top: string,
      geo: GeoJsonDto,
      args: ParameterDto,
      dbBuilderParameter: dbRequestBuilderSample,
    ) => Promise<[string, any[]]>,
  ): Promise<QueryAndParameter> {
    const topics: string[] = [];
    const query: string[] = [];
    const parameter: string[] = [];
    args.topics.forEach((s) => {
      topics.push(s);
    });

    for await (const t of topics) {
      const q = await customFunction(this, t, geo, args, dbBuilderParameter);
      if (q.length === QUERY_PARAMETER_LENGTH) {
        query.push(<string>q[QUERY_ARRAY_POSITION]);
        parameter.push(String(q[PARAMETER_ARRAY_POSITION]));
      }
    }
    return {
      query: query,
      parameter: parameter,
    };
  }

  prepareDBResponse(
    query: any,
    requestParams: ParameterDto,
    result: GeoJsonDto[],
    map: Map<string, any>,
  ): GeoJsonDto[] {
    const tmpResult = this.dbToGeoJSON(query);
    this.addUserInputToResponse(tmpResult, requestParams, map);
    //ensure that the result is an GeoJSON[] and not GeoJSON[][]
    return this.setGeoJSONArray(tmpResult, result, requestParams);
  }

  /**
   * Explanation:
   * generates the db query and waits for the response
   */
  async generateQuery(
    geo: GeoJsonDto,
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<string> {
    if (geo.type !== 'Feature') {
      // TODO support Feature collection
      throw new HttpException(
        'Currently only GeoJSON Features are supported',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryData = await this.collectQueries(
      args,
      geo,
      dbBuilderParameter,
      this.createSelectQueries,
    );
    return await this.buildUnionStatement(queryData.query);
  }

  /**
   * Explanation:
   *  Iterate over all queries to create a single Query:
   *   (a) UNION (b) UNION (c) ...
   *   Send the single complete request to the db
   */
  async buildUnionStatement(sqlQueries: string[]): Promise<string> {
    // Merge all the parameters from the other queries into a single object. You'll need to make sure that all your parameters have unique names
    const queries = sqlQueries.map((q, index) => {
      return q.replace('$1', '$' + (index + 1));
    });
    // Join all your queries into a single SQL string
    return '(' + queries.join(') UNION ALL (') + ')';
  }

  /**
   * Explanation:
   * Function can be used to call/execute plain sql statements
   */
  async executePlainDatabaseQuery(
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<GeneralResponse> {
    let queryString = '';
    if (dbBuilderParameter.selectStatement) {
      queryString += dbBuilderParameter.selectStatement;
    }
    if (dbBuilderParameter?.whereStatement) {
      queryString += dbBuilderParameter.whereStatement;
    }
    if (dbBuilderParameter?.fromStatement) {
      queryString += dbBuilderParameter.fromStatement;
    }
    const dbResult = await this.dataSource.query(queryString);
    if (!dbResult.length) {
      throw new HttpException(
        'Error: Query can not be executed ',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return { response: dbResult } as GeneralResponse;
  }

  /**
   * Explanation:
   * Function which prepares the user's input for the actual database query and which return the actual result
   * This function is used as the wrapper for all geometry-like interfaces
   */
  async calculateMethode(
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    await this.dynamicValidation(args);
    let geoInput = args.inputGeometries;

    if (this.transformService.isEsriJSON(geoInput)) {
      if (geoInput.length) {
        // TODO check esrijson input
        geoInput = this.transformService.convertEsriJSONToGeoJSON({
          input: geoInput,
        } as TransformEsriToGeoDto);
      }
    } else if (!this.transformService.isGeoJSON(geoInput)) {
      //TODO error handling
    }
    // Force Type
    geoInput = geoInput as GeoJsonDto[];
    let result: GeoJsonDto[] = [];
    // iterate through all geometries
    const queryArray: string[] = [];

    const requestParams = this.setRequestParameterForResponse(args);
    let index = 0;
    const idParameterMap = new Map<string, any>();
    for await (const geo of geoInput) {
      const id = this.getAndSetGeoID(geo, index);
      idParameterMap.set(id, geo.properties);
      index++;
      // const requestParams: any = this.setRequestParameterForResponse(args, geo);
      const query = await this.generateQuery(geo, args, dbBuilderParameter);
      queryArray.push(query);
    }
    let queryString = '';
    for (const query of queryArray) {
      if (queryString) {
        queryString += ' UNION ALL ' + query;
      } else {
        queryString = query;
      }
    }
    const dbResult = await this.dataSource.query(queryString);
    result = this.prepareDBResponse(
      dbResult,
      requestParams,
      result,
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
