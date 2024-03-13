import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import configuration from '../src/config/configuration';
import { GeneralModule } from '../src/general/general.module';
import { ValuesAtPointController } from '../src/values-at-point/values-at-point.controller';
import { ValuesAtPointService } from '../src/values-at-point/values-at-point.service';
import {
  GET,
  HEADERS_JSON,
  POST,
  TOPIC_URL,
  URL_START,
  VAlUES_AT_POINT,
  VALUES_AT_POINT_URL,
} from './common/constants';
import {
  getGeoJSONFeatureFromResponse,
  resultIsGeoJSONFeatureWithoutGeometry,
  testStatus200,
  topicTest,
} from './common/test';
import { getGeoJSONFeature } from './common/testDataPreparer';
import { TransformModule } from '../src/transform/transform.module';

describe('ValuesAtPointController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
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
        } as TypeOrmModule),
        GeneralModule,
        TransformModule,
      ],
      providers: [ValuesAtPointService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await setUpOpenAPIAndValidation(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/GET Topics', async () => {
    const result = await app.inject({
      method: GET,
      url: URL_START + VALUES_AT_POINT_URL + TOPIC_URL,
    });
    await testStatus200('/GET Topics', result);
  });

  it('/POST ValuesAtPoint without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['hoehe'],
      returnGeometry: false,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.865, 51.0642],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST ValuesAtPoint without geometry';
    await testStatus200(implName, result);

    const geoJSON = await getGeoJSONFeatureFromResponse(result);
    expect(geoJSON.length).toBe(2);
    await topicTest(VAlUES_AT_POINT, geoJSON[0], 'hoehe');
    await topicTest(VAlUES_AT_POINT, geoJSON[1], 'hoehe');
    await resultIsGeoJSONFeatureWithoutGeometry(result);
  });
  it('/POST within custom without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['hoehe'],
      returnGeometry: false,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.865, 51.0642],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within custom without geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    // Land has currently just on item! kreis_f 2 => 1+2=3
    expect(geojsonArray.length === 2);
    const heightsGeoJSON = geojsonArray[0];
    const domGeoJSON = geojsonArray[1];

    // test kreis response
    expect(heightsGeoJSON.geometry === null).toBeTruthy();
    expect(heightsGeoJSON.type).toBe('Feature');

    const props = heightsGeoJSON.properties;
    expect(props['__name']).toBe('hoehe_gelaende_dgm2');
    expect(props['__topic']).toBe('hoehe');
    expect(props['__height']).toBe(24886);

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['returnGeometry']).toBe(false);
    expect(requestProps['outputFormat']).toBe('geojson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test land response
    expect(domGeoJSON.geometry === null).toBeTruthy();
    expect(domGeoJSON.type).toBe('Feature');

    const propsLand = domGeoJSON.properties;
    expect(propsLand['__name']).toBe('hoehe_oberflaeche_dom2');
    expect(propsLand['__topic']).toBe('hoehe');
    expect(propsLand['__height']).toBe(24886);

    const geoPropsLand = propsLand['__geoProperties'];
    const requestPropsLand = propsLand['__requestParams'];
    expect(requestPropsLand['returnGeometry']).toBe(false);
    expect(requestPropsLand['outputFormat']).toBe('geojson');

    expect(geoPropsLand['name']).toBe('testname');
    expect(geoPropsLand['test']).toBe(9);
    expect(geoPropsLand['__geometryIdentifier__']).toBeDefined();
  });
});
