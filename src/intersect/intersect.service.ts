import { Injectable } from '@nestjs/common';
import { DataSource, GeoJSON, Geometry, Point, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';
import { DBResponse, ErrorResponse } from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import { geojsonToPostGis, topic } from '../general/general.constants';
import { ParameterDto } from '../general/dto/parameter.dto';
import { KreisEntity } from '../general/entities/kreis.entity';

@Injectable()
export class IntersectService {
  constructor(
    @InjectRepository(LandEntity)
    private landRepository: Repository<LandEntity>,
    @InjectRepository(KreisEntity)
    private kreisRepository: Repository<KreisEntity>,
    @InjectDataSource()
    private dataSource: DataSource,
    private generalService: GeneralService,
  ) {}
  getTopics(): string[] {
    return [''];
  }

  _getRepository(top: topic): Repository<any> {
    switch (top) {
      case topic.land: {
        return this.landRepository;
      }
      case topic.kreis: {
        return this.kreisRepository;
      }
      case topic.gemeinde: {
        return null;
      }
    }
    return null;
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
    console.log('test SQL', queries);
    // Join all your queries into a single SQL string
    const unionedQuery = '(' + queries.join(') UNION ALL (') + ')';

    // Create a new querybuilder with the joined SQL string as a FROM subquery
    return await this.dataSource.query(unionedQuery, sqlParameter);
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
    const query1 = await this.createSelectQueries(topic.land, geo.geometry);
    const query2 = await this.createSelectQueries(topic.kreis, geo.geometry);
    query1.push(query2);
    //Sowas von TODO
    // console.log('query1', query1);
    // console.log('query2', query2);
    const queries: string[] = [];
    const parameter: any[] = [];
    queries.push(query1[0]);
    queries.push(query2[0]);
    parameter.push(query1[1][0]);
    parameter.push(query2[1][0]);
    const query = (await this.calculateIntersectUnion(
      queries,
      parameter,
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
