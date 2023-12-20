import { DataSource, GeoJSON, Geometry } from 'typeorm';
import {
  dbRequestBuilderSample,
  DBResponse,
  QueryAndParameter,
  SupportedTopics,
  topicDefinition,
  topicDefinitionOutside,
} from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  EPSG_REGEX,
  GEO_IDENTIFIER,
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

@Injectable()
export class GeneralService {
  topicsArray: string[] = [];
  topicsDatabaseName: Map<string, string> = new Map<string, string>();
  topicsDatabaseAttributes: Map<string, string[]> = new Map<string, string[]>();
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
    const t = this.configService.get<string>('__topicsConfig__');
    const topicDef = JSON.parse(t);
    this._setDynamicTopicsConfigurations(topicDef as topicDefinition[]);
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

      this.topicsDatabaseName.set(t.identifier, t.__source__);
      if (t.__attributes__) {
        this.topicsDatabaseAttributes.set(t.identifier, t.__attributes__);
      } else {
        this.topicsDatabaseAttributes.set(t.identifier, ['*']);
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
  dbToGeoJSON(response: DBResponse[]): GeoJSON[] {
    if (response.length) {
      return response.map((r) => r.response);
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
  _buildGeometry(geo: Geometry): string {
    const coordinates = geojsonToWKT(geo);
    return STANDARD_SRID + coordinates;
  }

  /*
  We read the crs from coordinate from geojson
  REMINDER: GEOJSON doesn't support crs, but postgis automatically adds crs in the response
  We currently use this bridge to support 25833, the database crs, till the transformer is available
   */
  getCoordinateSystem(geo: any): number {
    if (geo?.crs) {
      const name = geo.crs.properties?.name;
      if (name) {
        const match = name.match(EPSG_REGEX);
        if (match.length === 1) {
          return Number(match[0]);
        }
      }
    }
    return STANDARD_CRS;
  }

  /**
   * Explanation:
   * Helper function: Returns the ID of the single geo feature, that was set by the user or automated generated if not
   */
  _getGeometryIdentifier(geo: GeoJSON): string {
    if (geo.type === 'Feature') {
      return geo.properties[GEO_IDENTIFIER];
    }
    return undefined;
  }
  /**
   * Explanation:
   * Returns the ID of the single geo feature if set and generates it if not
   */
  getAndSetGeoID(geo: GeoJSON, index: number): string {
    const id = this._getGeometryIdentifier(geo);
    if (!id) {
      return '__ID:' + index;
    }
    return id;
  }

  /**
   * Explanation:
   * Adds the user input in the response for the user
   */
  addUserInputToResponse(
    geoArray: GeoJSON[],
    inputGeo: GeoJSON,
    index: number,
    requestParams: any,
  ): void {
    if (!geoArray?.length) {
      return;
    }
    const id = this.getAndSetGeoID(inputGeo, index);
    geoArray.forEach((geo) => {
      if (geo.type === 'FeatureCollection') {
        const features = geo.features;
        if (!features?.length) {
          return;
        }
        features.forEach((feature) => {
          feature.properties[GEO_IDENTIFIER] = id;
          feature.properties[REQUESTPARAMS] = requestParams;
        });
      } else if (geo.type === 'Feature') {
        geo.properties[GEO_IDENTIFIER] = id;
        geo.properties[REQUESTPARAMS] = requestParams;
      }
    });
  }

  /**
   * Explanation:
   * collects which input parameter should be included in the response
   */
  setRequestParameterForResponse(args: ParameterDto, geo: GeoJSON): any {
    let props = {};
    if (geo.type === 'Feature') {
      props = geo.properties;
    }
    return {
      topics: args.topics,
      outputFormat: args.outputFormat,
      returnGeometry: args.returnGeometry,
      properties: props,
    };
  }

  /**
   * Explanation:
   * assures that the result is always a GeoJSON[] formate
   */
  setGeoJSONArray(result: GeoJSON[], resultArray: GeoJSON[]): GeoJSON[] {
    if (!resultArray.length) {
      resultArray = result;
    } else {
      result.forEach((r) => {
        resultArray.push(r);
      });
    }
    return resultArray;
  }

  getDBName(top: string): string {
    return this.topicsDatabaseName.get(top);
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
    geo: Geometry,
    args: ParameterDto,
  ): [string, any[]] {
    let result: string = '';
    if (dbBuilderParameter.selectStatement) {
      result += dbBuilderParameter.selectStatement;
    } else {
      result += QUERY_SELECT;
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
        geo,
        args,
      );
      result += ' ' + replacedString;
    }
    if (dbBuilderParameter.whereStatementParameter?.size) {
      const replacedString = this._replaceHelper(
        dbBuilderParameter.whereStatementParameter,
        dbBuilderParameter.whereStatement,
        top,
        geo,
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
    geo: Geometry,
    args: ParameterDto,
  ): string {
    if (!statementParameter.size) {
      return '';
    }

    let replacedString = parameterString;
    statementParameter.forEach((value, key) => {
      switch (value) {
        case ReplaceStringType.TABLE: {
          const table = this.getDBName(top);
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
          const topicAttributes = this.topicsDatabaseAttributes.get(top);
          if (topicAttributes.length) {
            topicAttributes.forEach((a) => {
              attr += ',' + a;
            });
          }
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
    geo: Geometry,
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
    geo: Geometry,
    dbBuilderParameter: dbRequestBuilderSample,
    customFunction: (
      service: any,
      top: string,
      geo: Geometry,
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
    geo: GeoJSON,
    index: number,
    requestParams: ParameterDto,
    result: GeoJSON[],
  ): GeoJSON[] {
    const tmpResult = this.dbToGeoJSON(query);
    this.addUserInputToResponse(tmpResult, geo, index, requestParams);
    //ensure that the result is an GeoJSON[] and not GeoJSON[][]
    return this.setGeoJSONArray(tmpResult, result);
  }

  /**
   * Explanation:
   * generates the db query and waits for the response
   */
  async generateQuery(
    geo: GeoJSON,
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<any> {
    if (geo.type !== 'Feature') {
      // TODO support Feature collection
      throw new HttpException(
        'Currently only GeoJSON Features are supported',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryData = await this.collectQueries(
      args,
      geo.geometry,
      dbBuilderParameter,
      this.createSelectQueries,
    );
    return (await this.buildUnionStatement(
      queryData.query,
      queryData.parameter,
    )) as DBResponse[];
  }

  /**
   * Explanation:
   *  Iterate over all queries to create a single Query:
   *   (a) UNION (b) UNION (c) ...
   *   Send the single complete request to the db
   */
  async buildUnionStatement(
    sqlQueries: string[],
    sqlParameter: string[],
  ): Promise<any> {
    // Merge all the parameters from the other queries into a single object. You'll need to make sure that all your parameters have unique names
    const queries = sqlQueries.map((q, index) => {
      return q.replace('$1', '$' + (index + 1));
    });
    // Join all your queries into a single SQL string
    const unionQuery = '(' + queries.join(') UNION ALL (') + ')';
    // Create a new querybuilder with the joined SQL string as a FROM subquery
    if (sqlParameter.length && sqlParameter[0]) {
      return await this.dataSource.query(unionQuery, sqlParameter);
    }
    return await this.dataSource.query(unionQuery);
  }

  /**
   * Explanation:
   * Prepares User input and send it to helper functions
   */
  async calculateMethode(
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<GeoJSON[]> {
    await this.dynamicValidation(args);
    let geoInput = args.inputGeometries;

    if (this.transformService.isEsriJSON(geoInput)) {
      geoInput = this.transformService.convertEsriJSONToGeoJSON({
        esriJsonArray: geoInput,
      }) as GeoJSON[];
    } else if (!this.transformService.isGeoJSON(geoInput)) {
      //TODO error handling
    }

    let result: GeoJSON[] = [];
    // iterate through all geometries
    let index = 0;
    for await (const geo of geoInput) {
      const requestParams: any = this.setRequestParameterForResponse(args, geo);
      const query = await this.generateQuery(geo, args, dbBuilderParameter);
      result = this.prepareDBResponse(query, geo, index, requestParams, result);
      index++;
    }
    if (!result.length) {
      throw new HttpException(
        'No result calculated!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return result;
  }
}
