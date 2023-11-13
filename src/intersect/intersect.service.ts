import { Injectable } from '@nestjs/common';
import { DataSource, GeoJSON, Geometry, Point, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';
import { DBResponse, ErrorResponse } from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import { geojsonToPostGis } from '../general/general.constants';
import { ParameterDto } from '../general/dto/parameter.dto';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
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

  async createSelectQueries(
    entity: EntityClassOrSchema,
    geo: Geometry,
  ): Promise<[string, any[]]> {
    return (
      this.landRepository
        // .createQueryBuilder('table1')
        // .select('table1.id')
        // .where('table1.id = :input_id', { input_id: 10 })
        // .getQueryAndParameters();
        .createQueryBuilder('table1')
        .select(
          'json_build_object(\n' +
            "    'type', 'FeatureCollection',\n" +
            "    'features', json_agg(ST_AsGeoJSON(l.*)::json)\n" +
            '  ) as response',
        ) // TODO db specific version
        .from(entity, 'l')
        .where('ST_intersects(table1.geom, :x::geometry)', {
          x: this._buildGeometry(geo),
        }) // TODO db specific version
        .limit(100) // just for testing
        .getQueryAndParameters()
    );
  }
  async createSelectQueries2(
    entity: EntityClassOrSchema,
    geo: Geometry,
  ): Promise<[string, any[]]> {
    return this.kreisRepository
      .createQueryBuilder('table2')
      .select(
        'json_build_object(\n' +
          "    'type', 'FeatureCollection',\n" +
          "    'features', json_agg(ST_AsGeoJSON(k.*)::json)\n" +
          '  ) as response',
      ) // TODO db specific version
      .from(entity, 'k')
      .where('ST_intersects(table2.geom, :x::geometry)', {
        x: this._buildGeometry(geo),
      }) // TODO db specific version
      .limit(100) // just for testing
      .getQueryAndParameters();
  }

  async calculateIntersectUnion(
    sqlQueries: string[],
    sqlParameter: string[],
  ): Promise<any> {
    // const inputGeos = args.inputGeometries;
    // const sqlQueryBuilderArray: SelectQueryBuilder<unknown>[] = [];
    console.log('fuck you', sqlQueries);

    // Merge all the parameters from the other queries into a single object. You'll need to make sure that all your parameters have unique names
    const queries = sqlQueries.map((q, index) => {
      console.log('!!!', { q, index });
      return q.replace('$1', '$' + (index + 1));
    });
    console.log('test SQL', queries);
    // Join all your queries into a single SQL string
    const unionedQuery = '(' + queries.join(') UNION ALL (') + ')';

    // Create a new querybuilder with the joined SQL string as a FROM subquery
    const result = await this.dataSource.query(unionedQuery, sqlParameter);
    console.log('result', result);
    return result;
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJSON | ErrorResponse> {
    const geoInput = args.inputGeometries as GeoJSON[];
    let geo: GeoJSON;
    if (Array.isArray(geoInput)) {
      geo = geoInput[0];
    }
    if (geo.type !== 'Feature') {
      return undefined;
    }
    const query1 = await this.createSelectQueries(LandEntity, geo.geometry);
    const query2 = await this.createSelectQueries2(KreisEntity, geo.geometry);
    query1.push(query2);
    //Sowas von TODO
    console.log('query1', query1);
    console.log('query2', query2);
    const queries: string[] = [];
    const parameter: any[] = [];
    queries.push(query1[0]);
    queries.push(query2[0]);
    parameter.push(query1[1][0]);
    parameter.push(query2[1][0]);
    const query = await this.calculateIntersectUnion(queries, parameter);
    console.log('test', query);
    console.log('test result', query[0].response.features);

    const featureCollection = (await this.landRepository
      .createQueryBuilder('land') //TODO topic specifc call
      .select(
        'json_build_object(\n' +
          "    'type', 'FeatureCollection',\n" +
          "    'features', json_agg(ST_AsGeoJSON(l.*)::json)\n" +
          '  ) as response',
      ) // TODO db specific version
      .from(LandEntity, 'l')
      .where('ST_intersects(land.geom, :x::geometry)', {
        x: this._buildGeometry(geo.geometry),
      }) // TODO db specific version
      .limit(100) // just for testing
      .getRawMany()) as DBResponse[];

    //x: 'SRID=25833;POINT(377234 5658210)'

    return this.generalService.dbToGeoJSON(featureCollection);
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
