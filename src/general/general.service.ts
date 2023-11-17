import {
  DataSource,
  GeoJSON,
  Geometry,
  LineString,
  Point,
  Polygon,
  Repository,
} from 'typeorm';
import {
  CrsGeometry,
  DBResponse,
  ErrorResponse,
  QueryAndParameter,
} from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  DATABASE_CRS,
  DB_LIMIT,
  EPSG_REGEX,
  GEO_IDENTIFIER,
  geojsonToPostGis,
  PARAMETER_ARRAY_POSITION,
  QUERY_ARRAY_POSITION,
  QUERY_PARAMETER_LENGTH,
  QUERY_SELECT,
  QUERY_TABLE_NAME,
  REQUESTPARAMS,
  STANDARD_CRS,
  topic,
} from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { LandEntity } from './entities/land.entity';
import { KreisEntity } from './entities/kreis.entity';
import { ParameterDto } from './dto/parameter.dto';

@Injectable()
export class GeneralService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getRepository(top: topic): Repository<any> {
    let entity;
    switch (top) {
      case topic.land: {
        entity = LandEntity;
        break;
      }
      case topic.kreis: {
        entity = KreisEntity;
        break;
      }
    }
    return this.dataSource.getRepository(entity);
  }

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

  getDBSpecificSelect(): string {
    // TODO other DB's
    return QUERY_SELECT;
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
  addGeoIdentifier(
    geoArray: GeoJSON[],
    inputGeo: GeoJSON,
    index: number,
    requestParams: any,
  ): void {
    if (!geoArray.length) {
      return;
    }
    const id = this.getAndSetGeoID(inputGeo, index);
    geoArray.forEach((geo) => {
      if (geo.type === 'FeatureCollection') {
        const features = geo.features;
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

  async createSelectQueries(
    service: any,
    top: topic,
    geo: Geometry,
    crs: number,
    whereClause: string,
    whereClauseParameter: string,
  ): Promise<[string, any[]]> {
    const whereParameter = {};
    whereParameter[whereClauseParameter] = service._buildGeometry(geo, crs);
    return service
      .getRepository(top)
      .createQueryBuilder(QUERY_TABLE_NAME)
      .select(service.getDBSpecificSelect())
      .where(whereClause, whereParameter)
      .limit(DB_LIMIT) // just for testing
      .getQueryAndParameters();
  }

  async collectQueries(
    topicsString: string[],
    geo: Geometry,
    crs: number,
    whereClause: string,
    whereClauseParameter: string,
    customFunction: (
      service: any,
      top: topic,
      geo: Geometry,
      crs: number,
      whereClause: string,
      whereClauseParameter: string,
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
        whereClause,
        whereClauseParameter,
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
    intersectWhereClause: string,
    intersectWhereClauseParameter: string,
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
      intersectWhereClause,
      intersectWhereClauseParameter,
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
    return await this.dataSource.query(unionedQuery, sqlParameter);
  }

  async calculateMethode(
    args: ParameterDto,
    whereClause: string,
    whereClauseParameter: string,
  ): Promise<GeoJSON[]> {
    const geoInput = args.inputGeometries;

    const requestParams: any = this.setRequestParameterForResponse(args);

    let result: GeoJSON[] = [];
    // iterate through all geometries
    let index = 0;
    for await (const geo of geoInput) {
      const query = await this.generateQuery(
        geo,
        args,
        whereClause,
        whereClauseParameter,
      );
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
