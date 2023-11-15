import { Injectable } from '@nestjs/common';
import { DataSource, GeoJSON, Geometry, Point, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';
import {
  DBResponse,
  ErrorResponse,
  QueryAndParameter,
} from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import { geojsonToPostGis, topic } from '../general/general.constants';
import { ParameterDto } from '../general/dto/parameter.dto';
import { KreisEntity } from '../general/entities/kreis.entity';

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

  _getRepository(top: topic): Repository<any> {
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

  async createSelectQueries(
    top: topic,
    geo: Geometry,
  ): Promise<[string, any[]]> {
    return this._getRepository(top)
      .createQueryBuilder('table1')
      .select(
        'json_build_object(\n' +
          "    'type', 'FeatureCollection',\n" +
          "    'features', json_agg(ST_AsGeoJSON(table1.*)::json)\n" +
          '  ) as response',
      ) // TODO db specific version
      .where('ST_intersects(table1.geom, :x::geometry)', {
        x: this._buildGeometry(geo),
      }) // TODO db specific version
      .limit(100) // just for testing
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
  ): Promise<QueryAndParameter> {
    const topics: topic[] = [];
    const query: string[] = [];
    const parameter: string[] = [];
    topicsString.forEach((s) => {
      topics.push(s as topic);
    });

    for await (const t of topics) {
      const q = await this.createSelectQueries(t, geo);
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

    const queryData = await this._collectQueries(args.topics, geo.geometry);
    const query = (await this.calculateIntersectUnion(
      queryData.query,
      queryData.parameter,
    )) as DBResponse[];

    return this.generalService.dbToGeoJSON(query);
  }

  _buildGeometry(geo: Geometry): string {
    let result = 'SRID=25833;';
    const geoType = geojsonToPostGis.get(geo.type);
    result += geoType;
    const coordinates = this._buildCoordinatesFromDBType(geo);
    result += '(' + coordinates + ')';
    return result;
  }
  _buildCoordinatesFromDBType(geo: Geometry): string {
    if (geo.type === 'Point') {
      const point = geo as Point;
      return '' + point.coordinates[0] + ' ' + point.coordinates[1];
    }
    return '';
  }
}
