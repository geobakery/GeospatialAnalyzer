import {
  DataSource,
  GeoJSON,
  Geometry,
  LineString,
  Point,
  Polygon,
} from 'typeorm';
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
  DATABASE_CRS,
  EPSG_REGEX,
  GEO_IDENTIFIER,
  geojsonToPostGis,
  PARAMETER_ARRAY_POSITION,
  QUERY_ARRAY_POSITION,
  QUERY_PARAMETER_LENGTH,
  QUERY_SELECT,
  ReplaceStringType,
  REQUESTPARAMS,
  STANDARD_CRS,
} from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { ParameterDto } from './dto/parameter.dto';
import { ConfigService } from '@nestjs/config';

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
  _buildGeometry(geo: Geometry, crs: number): string {
    let result = 'SRID=' + crs + ';';
    const geoType = geojsonToPostGis.get(geo.type);
    result += geoType;
    const coordinates = this._buildCoordinatesFromDBType(geo);
    result += '(' + coordinates + ')';
    return result;
  }

  /**
   * Explanation:
   * helper function to transform geojson types to coordinate strings
   */
  _buildCoordinatesFromDBType(geo: Geometry): string {
    switch (geo.type) {
      case 'Point': {
        const point = geo as Point;
        return '' + point.coordinates[0] + ' ' + point.coordinates[1];
      }
      case 'GeometryCollection':
      case 'MultiPolygon':
      case 'MultiLineString':
      case 'MultiPoint': {
        //TODO
        // Example GEOMETRYCOLLECTION(POINT(2 0),POLYGON((0 0, 1 0, 1 1, 0 1, 0 0)))');
        switch (geo.type) {
          case 'MultiLineString': {
            break;
          }
          case 'MultiPoint': {
            break;
          }
          case 'GeometryCollection': {
            break;
          }
          case 'MultiPolygon': {
            break;
          }
        }
        return '';
      }
      case 'LineString': {
        const line = geo as LineString;
        let result: string = '';
        line.coordinates.forEach((c) => {
          result += '' + c.join(' ') + ',';
        });
        if (result.length) {
          result = result.slice(0, -1);
        }
        return result;
      }
      case 'Polygon': {
        const polygon = geo as Polygon;
        let result: string = '';
        polygon.coordinates.forEach((c) => {
          result += '(';
          c.forEach((c2) => {
            result += '' + c2.join(' ') + ',';
          });
          if (result.length) {
            // remove last comma for segment
            result = result.slice(0, -1);
          }
          result += '),';
        });

        if (result.length) {
          // remove last comma for polygon
          result = result.slice(0, -1);
        }
        return result;
      }
    }
    return '';
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
    crs: number,
    count: number,
  ): [string, any[]] {
    let result: string = '';
    if (dbBuilderParameter.selectStatement) {
      result += dbBuilderParameter.selectStatement;
    } else {
      result += QUERY_SELECT;
    }
    if (dbBuilderParameter.fromStatement) {
      const replacedString = this._replaceHelper(
        dbBuilderParameter.fromStatementParameter,
        dbBuilderParameter.fromStatement,
        top,
        geo,
        crs,
        count,
      );
      result += ' ' + replacedString;
    }
    if (dbBuilderParameter.whereStatementParameter?.size) {
      const replacedString = this._replaceHelper(
        dbBuilderParameter.whereStatementParameter,
        dbBuilderParameter.whereStatement,
        top,
        geo,
        crs,
        count,
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
    crs: number,
    count: number,
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
          const geoString = this._buildGeometry(geo, crs);
          replacedString = replacedString.replace(key, geoString);
          break;
        }
        case ReplaceStringType.COUNT: {
          if (count) {
            const countElement = String(count);
            replacedString = replacedString.replace(key, countElement);
          }
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
    crs: number,
    count: number,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<[string, any[]]> {
    // To replace Repositories, we only create raw sql statements
    if (dbBuilderParameter.customStatement) {
      return service.createRawQuery(dbBuilderParameter, top, geo, crs, count);
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
    topicsString: string[],
    geo: Geometry,
    crs: number,
    count: number,
    dbBuilderParameter: dbRequestBuilderSample,
    customFunction: (
      service: any,
      top: string,
      geo: Geometry,
      crs: number,
      count: number,
      dbBuilderParameter: dbRequestBuilderSample,
    ) => Promise<[string, any[]]>,
  ): Promise<QueryAndParameter> {
    const topics: string[] = [];
    const query: string[] = [];
    const parameter: string[] = [];
    topicsString.forEach((s) => {
      topics.push(s);
    });

    for await (const t of topics) {
      const q = await customFunction(
        this,
        t,
        geo,
        crs,
        count,
        dbBuilderParameter,
      );
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
    const crs = this.getCoordinateSystem(geo.geometry);
    if (crs != DATABASE_CRS) {
      // TODO transform points
      throw new HttpException(
        'Currently only EPSG:25833 is supported',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryData = await this.collectQueries(
      args.topics,
      geo.geometry,
      crs,
      args.count,
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
    const geoInput = args.inputGeometries;

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
