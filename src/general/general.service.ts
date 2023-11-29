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
} from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  DATABASE_CRS,
  DB_NAME,
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
  topic,
} from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { ParameterDto } from './dto/parameter.dto';

@Injectable()
export class GeneralService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

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

  _buildGeometry(geo: Geometry, crs: number): string {
    let result = 'SRID=' + crs + ';';
    const geoType = geojsonToPostGis.get(geo.type);
    result += geoType;
    const coordinates = this._buildCoordinatesFromDBType(geo);
    result += '(' + coordinates + ')';
    return result;
  }
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
  REMINDER: GEOJSON doesnt support crs, but postgis automatically adds crs in the response
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

  getGeometryIdentifier(geo: GeoJSON): string {
    if (geo.type === 'Feature') {
      return geo.properties[GEO_IDENTIFIER];
    }
    return undefined;
  }

  getAndSetGeoID(geo: GeoJSON, index: number): string {
    const id = this.getGeometryIdentifier(geo);
    if (!id) {
      return '__ID:' + index;
    }
    return id;
  }
  /*
  Helper to add the identifier to the db
  Alternative: change From table statement to a From (SELECT ...) statement parallel to nearestNeoghbour
  Drawback: we would always use raw sql statements
   */
  addGeoIdentifier(
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

  setRequestParameterForResponse(args: ParameterDto): any {
    return {
      topics: args.topics,
      outputFormat: args.outputFormat,
      returnGeometry: args.returnGeometry,
    };
  }

  /*
  assures that the result is always a GeoJSON[]
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

  /*
  Creates a custom raw sql statement from given Parameter
   */
  createRawQuery(
    dbBuilderParameter: dbRequestBuilderSample,
    top: topic,
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
      let replacedString = dbBuilderParameter.fromStatement;
      if (dbBuilderParameter.fromStatementParameter?.size) {
        dbBuilderParameter.fromStatementParameter.forEach((value, key) => {
          switch (value) {
            case ReplaceStringType.TABLE: {
              const table = DB_NAME + '.' + top;
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
      }
      result += ' ' + replacedString;
    }
    if (dbBuilderParameter.whereStatementParameter?.size) {
      let replacedString = dbBuilderParameter.whereStatement;
      //TODO generalize
      dbBuilderParameter.whereStatementParameter.forEach((value, key) => {
        switch (value) {
          case ReplaceStringType.TABLE: {
            const table = DB_NAME + '.' + top;
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
      result += ' ' + replacedString;
    }
    return [result, []];
  }

  /*
  Creates a single query for typeOrm (query as string, parameter as array)
   */
  async createSelectQueries(
    service: any,
    top: topic,
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

  /*
  Iterate over all queries to create a single Query:
  (a) UNION (b) UNION (c) ...
   */
  async collectQueries(
    topicsString: string[],
    geo: Geometry,
    crs: number,
    count: number,
    dbBuilderParameter: dbRequestBuilderSample,
    customFunction: (
      service: any,
      top: topic,
      geo: Geometry,
      crs: number,
      count: number,
      dbBuilderParameter: dbRequestBuilderSample,
    ) => Promise<[string, any[]]>,
  ): Promise<QueryAndParameter> {
    const topics: topic[] = [];
    const query: string[] = [];
    const parameter: string[] = [];
    topicsString.forEach((s) => {
      topics.push(s as topic);
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
    this.addGeoIdentifier(tmpResult, geo, index, requestParams);
    //ensure that the result is an GeoJSON[] and not GeoJSON[][]
    return this.setGeoJSONArray(tmpResult, result);
  }

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

  async buildUnionStatement(
    sqlQueries: string[],
    sqlParameter: string[],
  ): Promise<any> {
    // Merge all the parameters from the other queries into a single object. You'll need to make sure that all your parameters have unique names
    const queries = sqlQueries.map((q, index) => {
      return q.replace('$1', '$' + (index + 1));
    });
    // Join all your queries into a single SQL string
    const unionedQuery = '(' + queries.join(') UNION ALL (') + ')';
    // Create a new querybuilder with the joined SQL string as a FROM subquery
    if (sqlParameter.length && sqlParameter[0]) {
      return await this.dataSource.query(unionedQuery, sqlParameter);
    }
    return await this.dataSource.query(unionedQuery);
  }

  async calculateMethode(
    args: ParameterDto,
    dbBuilderParameter: dbRequestBuilderSample,
  ): Promise<GeoJSON[]> {
    const geoInput = args.inputGeometries;

    const requestParams: any = this.setRequestParameterForResponse(args);

    let result: GeoJSON[] = [];
    // iterate through all geometries
    let index = 0;
    for await (const geo of geoInput) {
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
