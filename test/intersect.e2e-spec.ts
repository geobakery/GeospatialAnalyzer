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
import { GeoJSONFeatureDto } from '../src/general/dto/geo-json.dto';
import {
  GEOJSON_WITH_GEOMETRY_KREIS,
  GEOJSON_WITHOUT_GEOMETRY_KREIS,
  GET,
  HEADERS_JSON,
  INTERSECT_URL,
  POST,
  TOPIC_URL,
  URL_START,
} from './common/constants';
import {
  getGeoJSONFeatureFromResponse,
  requestGeoPropertiesTest,
  requestParamsPropertiesTest,
  resultIsGeoJSONFeatureWithoutGeometry,
  resultProperties,
  testStatus200,
  topicTest,
} from './common/test';

describe('IntersectController (e2e)', () => {
  let app: NestFastifyApplication;
  const INTERSECT: string = 'Intersect';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.dev', '.env'],
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

  it('/GET Topics', async () => {
    const result = await app.inject({
      method: GET,
      url: URL_START + INTERSECT_URL + TOPIC_URL,
    });
    await testStatus200('/GET Topics', result);
  });

  it('/POST Intersect with geometry', async () => {
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: GEOJSON_WITH_GEOMETRY_KREIS,
      headers: HEADERS_JSON,
    });
    // console.log(result);
    expect(result.statusCode).toEqual(200);
    expect(result.statusMessage).toEqual('OK');
    const data = JSON.parse(result.payload);
    expect(data.length).toBeDefined();
    const geojson = data[0] as GeoJSONFeatureDto;
    expect(geojson.type === 'Feature').toBeTruthy();
    const geo = geojson.geometry;
    expect(geo.type === 'Polygon').toBeTruthy();
    expect(geo.coordinates).not.toBeNull();
    expect(geo.coordinates.length > 0).toBeTruthy();

    const props = geojson.properties;
    expect(props['__topic'] === 'verw_kreis_f').toBeTruthy();
    expect(props['name'] === 'Kreisfreie Stadt Dresden').toBeTruthy();
  });

  it('/POST Intersect without geometry', async () => {
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: GEOJSON_WITHOUT_GEOMETRY_KREIS,
      headers: HEADERS_JSON,
    });

    await testStatus200('/POST Intersect without geometry', result);

    await resultIsGeoJSONFeatureWithoutGeometry(result);
    const geojson = await getGeoJSONFeatureFromResponse(result);
    await topicTest(INTERSECT, geojson, 'verw_kreis_f');

    const propsMap = new Map<string, string | number | boolean>([
      ['name', 'Kreisfreie Stadt Dresden'],
    ]);
    await resultProperties('intersect', geojson, 'verw_kreis_f', propsMap);

    const requestParams = new Map<string, string | number | boolean>([
      ['timeout', 60000],
      ['returnGeometry', false],
    ]);
    await requestParamsPropertiesTest('intersect', geojson, requestParams);

    const geoParams = new Map<string, string | number | boolean>([
      ['name', 'testname'],
      ['test', 9],
    ]);
    await requestGeoPropertiesTest('intersect', geojson, geoParams);
  });
});
