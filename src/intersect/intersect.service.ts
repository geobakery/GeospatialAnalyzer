import { Injectable } from '@nestjs/common';
import { DataSource, GeoJSON, Geometry } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DBResponse,
  ErrorResponse,
  QueryAndParameter,
} from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import {
  DB_LIMIT,
  QUERY_TABLE_NAME,
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

  async createSelectQueries(
    top: topic,
    geo: Geometry,
    crs: number,
  ): Promise<[string, any[]]> {
    return this.generalService
      .getRepository(top)
      .createQueryBuilder(QUERY_TABLE_NAME)
      .select(this.generalService.getDBSpecificSelect())
      .where('ST_intersects(table1.geom, :x::geometry)', {
        x: this.generalService._buildGeometry(geo, crs),
      })
      .limit(DB_LIMIT) // just for testing
      .getQueryAndParameters();
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

  async _collectQueries(
    topicsString: string[],
    geo: Geometry,
    crs: number,
  ): Promise<QueryAndParameter> {
    const topics: topic[] = [];
    const query: string[] = [];
    const parameter: string[] = [];
    topicsString.forEach((s) => {
      topics.push(s as topic);
    });

    for await (const t of topics) {
      const q = await this.createSelectQueries(t, geo, crs);
      if (q.length === 2) {
        query.push(q[0]);
        parameter.push(String(q[1]));
      }
    }
    return {
      query: query,
      parameter: parameter,
    };
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJSON[] | ErrorResponse> {
    const geoInput = args.inputGeometries as GeoJSON[];
    let geo: GeoJSON;
    if (Array.isArray(geoInput)) {
      geo = geoInput[0];
    }
    if (geo.type !== 'Feature') {
      return undefined;
    }

    const queryData = await this._collectQueries(
      args.topics,
      geo.geometry,
      25833, //TODO
    );
    const query = (await this.calculateIntersectUnion(
      queryData.query,
      queryData.parameter,
    )) as DBResponse[];

    return this.generalService.dbToGeoJSON(query);
  }
}
