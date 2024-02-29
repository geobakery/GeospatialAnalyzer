import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IntersectController } from '../src/intersect/intersect.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../src/general/general.module';
import { IntersectService } from '../src/intersect/intersect.service';
import configuration from '../src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import {
  HEADERS_JSON,
  INTERSECT,
  INTERSECT_URL,
  POST,
  URL_START,
} from './common/constants';
import {
  getGeoJSONFeatureFromResponse,
  resultIsGeoJSONFeatureWithGeometry,
  testStatus200,
  topicTest,
} from './common/test';
import { getGeoJSONFeature } from './common/testDataPreparer';
import * as big_json from './common/big_geojson_coordinate.json';

describe('EdgeCases (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test'],
          load: [configuration],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: process.env.geospatial_analyzer_db_type,
          host: 'localhost',
          port: process.env.geospatial_analyzer_db_port,
          username: process.env.geospatial_analyzer_db_username,
          password: process.env.geospatial_analyzer_db_password,
          database: process.env.geospatial_analyzer_db_database,
          synchronize: false,
          logging: false,
          extra: {
            statement_timeout: 3, // number of milliseconds before a statement in query will time out, default is no timeout
            query_timeout: 3, // number of milliseconds before a query call will timeout, default is no timeout
          },
        } as TypeOrmModule),
        GeneralModule,
      ],
      providers: [IntersectService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST Payload too large', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f'],
      returnGeometry: true,
      fixGeometry: { type: 'Polygon', coordinates: big_json },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toEqual(413);
    expect(result.statusMessage).toBe('Payload Too Large');
  });

  it('/POST extrem low query time', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f'],
      returnGeometry: true,
      fixGeometry: { type: 'Point', coordinates: [0, 1] },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toEqual(408);
    expect(result.statusMessage).toBe('Request Timeout');
  });
});
