import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource, GeoJSON, Geometry } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DBResponse,
  ErrorResponse,
  QueryAndParameter,
} from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import {
  DATABASE_CRS,
  PARAMETER_ARRAY_POSITION,
  QUERY_ARRAY_POSITION,
  QUERY_PARAMETER_LENGTH,
  topic,
} from '../general/general.constants';
import { ParameterDto } from '../general/dto/parameter.dto';

@Injectable()
export class IntersectService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private generalService: GeneralService,
  ) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateIntersectUnion(
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

  // async _collectQueries(
  //   topicsString: string[],
  //   geo: Geometry,
  //   crs: number,
  //   customFunction: (
  //     service: any,
  //     top: topic,
  //     geo: Geometry,
  //     crs: number,
  //   ) => Promise<[string, any[]]>,
  // ): Promise<QueryAndParameter> {
  //   const topics: topic[] = [];
  //   const query: string[] = [];
  //   const parameter: string[] = [];
  //   topicsString.forEach((s) => {
  //     topics.push(s as topic);
  //   });
  //
  //   for await (const t of topics) {
  //     const q = await customFunction(this.generalService, t, geo, crs);
  //     if (q.length === QUERY_PARAMETER_LENGTH) {
  //       query.push(<string>q[QUERY_ARRAY_POSITION]);
  //       parameter.push(String(q[PARAMETER_ARRAY_POSITION]));
  //     }
  //   }
  //   return {
  //     query: query,
  //     parameter: parameter,
  //   };
  // }

  async generateQuery(geo: GeoJSON, args: ParameterDto): Promise<any> {
    if (geo.type !== 'Feature') {
      // TODO support Feature collection
      throw new HttpException(
        'Currently only GeoJSON Features are supported',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    const crs = this.generalService.getCoordinateSystem(geo.geometry);
    if (crs != DATABASE_CRS) {
      // TODO transform points
      throw new HttpException(
        'Currently only EPSG:25833 is supported',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const queryData = await this.generalService.collectQueries(
      args.topics,
      geo.geometry,
      crs,
      'ST_intersects(table1.geom, :x::geometry)',
      'x',
      this.generalService.createSelectQueries,
    );
    return (await this.calculateIntersectUnion(
      queryData.query,
      queryData.parameter,
    )) as DBResponse[];
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJSON[] | ErrorResponse> {
    const geoInput = args.inputGeometries;

    const requestParams: any =
      this.generalService.setRequestParameterForResponse(args);

    let result: GeoJSON[] = [];
    // iterate through all geometries
    let index = 0;
    for await (const geo of geoInput) {
      const query = await this.generateQuery(geo, args);
      result = this.generalService.prepareDBResponse(
        query,
        geo,
        index,
        requestParams,
        result,
      );
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
