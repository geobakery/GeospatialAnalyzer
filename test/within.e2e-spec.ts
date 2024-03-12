import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import configuration from '../src/config/configuration';
import { WithinParameterDto } from '../src/general/dto/parameter.dto';
import { GeneralModule } from '../src/general/general.module';
import { WithinController } from '../src/within/within.controller';
import { WithinService } from '../src/within/within.service';
import {
  GET,
  HEADERS_JSON,
  POST,
  TOPIC_URL,
  URL_START,
  WITHIN,
  WITHIN_URL,
} from './common/constants';
import {
  getESRISONFeatureFromResponse,
  getGeoJSONFeatureFromResponse,
  resultIsGeoJSONFeatureWithGeometry,
  resultIsGeoJSONFeatureWithoutGeometry,
  testStatus200,
  testStatus400,
  topicTest,
} from './common/test';
import {
  getEsriJSONFeature,
  getGeoJSONFeature,
} from './common/testDataPreparer';
import { TransformModule } from '../src/transform/transform.module';

describe('WithinController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [WithinController],
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
      providers: [WithinService],
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
      url: URL_START + WITHIN_URL + TOPIC_URL,
    });
    await testStatus200('/GET Topics', result);
  });

  it('/POST within with geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f'],
      returnGeometry: true,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.75, 51.072],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within without geometry';
    await testStatus200(implName, result);

    const geoJSON = await getGeoJSONFeatureFromResponse(result);
    expect(geoJSON.length).toBe(1);
    await topicTest(WITHIN, geoJSON[0], 'verw_kreis_f');
    await resultIsGeoJSONFeatureWithGeometry(result, 'Polygon');
  });

  //TODO maxDistanceToNeighbour missing

  it('/POST within without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f'],
      returnGeometry: false,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.75, 51.072],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect without geometry';
    await testStatus200(implName, result);
    await resultIsGeoJSONFeatureWithoutGeometry(result);
  });

  it('/POST within custom without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f', 'verw_land_f'],
      returnGeometry: false,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.75, 51.07],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within custom without geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    // Land has currently just on item! kreis_f 2 => 1+2=3
    expect(geojsonArray.length === 2);
    const verwKreisGeoJSON = geojsonArray[0];
    const verwLandGeoJSON = geojsonArray[1];

    // test verw_kreis_f response
    expect(verwKreisGeoJSON.geometry === null).toBeTruthy();
    expect(verwKreisGeoJSON.type).toBe('Feature');

    console.log(verwKreisGeoJSON);

    const props = verwKreisGeoJSON.properties;
    expect(props['name']).toBe('Kreisfreie Stadt Dresden');
    expect(props['__topic']).toBe('verw_kreis_f');

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['returnGeometry']).toBe(false);
    expect(requestProps['outputFormat']).toBe('geojson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test verw_land_f response
    expect(verwLandGeoJSON.geometry === null).toBeTruthy();
    expect(verwLandGeoJSON.type).toBe('Feature');

    const propsLand = verwLandGeoJSON.properties;
    expect(propsLand['name']).toBe('Sachsen');
    expect(propsLand['__topic']).toBe('verw_land_f');

    const geoPropsLand = propsLand['__geoProperties'];
    const requestPropsLand = propsLand['__requestParams'];
    expect(requestPropsLand['returnGeometry']).toBe(false);
    expect(requestPropsLand['outputFormat']).toBe('geojson');

    expect(geoPropsLand['name']).toBe('testname');
    expect(geoPropsLand['test']).toBe(9);
    expect(geoPropsLand['__geometryIdentifier__']).toBeDefined();
  });

  it('/POST within with esri input and output', async () => {
    const input = getEsriJSONFeature({
      returnGeometry: true,
      outputFormat: 'esrijson',
      topics: ['verw_kreis_f'],
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within custom with geometry';
    await testStatus200(implName, result);

    const esrijsonArray = await getESRISONFeatureFromResponse(result);
    expect(esrijsonArray.length).toBe(1);
    const verwEsri = esrijsonArray[0];

    // test verw_kreis_f response
    expect(verwEsri.geometry !== null).toBeTruthy();
    expect(verwEsri.attributes).toBeDefined();

    const props = verwEsri.attributes;
    expect(props['name']).toBe('Kreisfreie Stadt Dresden');
    expect(props['__topic']).toBe('verw_kreis_f');

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['returnGeometry']).toBe(true);
    expect(requestProps['outSRS']).toBe(25833);
    expect(requestProps['outputFormat']).toBe('esrijson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test geometry
    const geo = verwEsri.geometry;
    expect(geo.spatialReference).toBeDefined();
    expect(geo.spatialReference.wkid).toBeDefined();
    expect(geo.spatialReference.wkid).toBe(25833);
    expect(geo.rings).toBeDefined();
    expect(geo.rings.length).toBeGreaterThan(0);
    const coordinates = geo.rings;
    expect(coordinates.length).toBeGreaterThan(0);
    // TODO after swagger update add tests for rigns with number[][][]
  });

  it('/POST within with false topic', async () => {
    const input = getEsriJSONFeature({
      returnGeometry: false,
      outputFormat: 'esrijson',
      topics: ['verw_test_f'],
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within custom with geometry';
    await testStatus400(implName, result);

    const data = JSON.parse(result.payload);
    expect(data).toBeDefined();
    expect(data.message).toContain('Unsupported topic');
  });
});
