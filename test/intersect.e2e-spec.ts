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
  ESRI_JSON_WITHOUT_GEOMETRY_KREIS,
  GEOJSON_WITHOUT_GEOMETRY_KREIS,
  GET,
  HEADERS_JSON,
  INTERSECT,
  INTERSECT_URL,
  POST,
  TOPIC_URL,
  URL_START,
} from './common/constants';
import {
  getESRISONFeatureFromResponse,
  getGeoJSONFeatureFromResponse,
  resultIsGeoJSONFeatureWithGeometry,
  resultIsGeoJSONFeatureWithoutGeometry,
  testStatus200,
  topicTest,
} from './common/test';
import {
  getEsriJSONFeature,
  getGeoJSONFeature,
} from './common/testDataPreparer';

describe('IntersectController (e2e)', () => {
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
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f'],
      returnGeometry: true,
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect without geometry';
    await testStatus200(implName, result);

    const geoJSON = await getGeoJSONFeatureFromResponse(result);
    expect(geoJSON.length).toBe(1);
    await topicTest(INTERSECT, geoJSON[0], 'verw_kreis_f');
    await resultIsGeoJSONFeatureWithGeometry(result, 'Polygon');
  });

  it('/POST Intersect without geometry', async () => {
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: GEOJSON_WITHOUT_GEOMETRY_KREIS,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect without geometry';
    await testStatus200(implName, result);
    await resultIsGeoJSONFeatureWithoutGeometry(result);
  });

  it('/POST Intersect custom without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_kreis_f', 'verw_land_f'],
      returnGeometry: false,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.746, 51.0629],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect custom without geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    expect(geojsonArray.length === 2);
    const verwKreisGeoJSON = geojsonArray[0];
    const verwLandGeoJSON = geojsonArray[1];

    // test verw_kreis_f response
    expect(verwKreisGeoJSON.geometry === null).toBeTruthy();
    expect(verwKreisGeoJSON.type).toBe('Feature');

    const props = verwKreisGeoJSON.properties;
    expect(props['name']).toBe('Kreisfreie Stadt Dresden');
    expect(props['__topic']).toBe('verw_kreis_f');

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['timeout']).toBe(60000);
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
    expect(requestPropsLand['timeout']).toBe(60000);
    expect(requestPropsLand['returnGeometry']).toBe(false);
    expect(requestPropsLand['outputFormat']).toBe('geojson');

    expect(geoPropsLand['name']).toBe('testname');
    expect(geoPropsLand['test']).toBe(9);
    expect(geoPropsLand['__geometryIdentifier__']).toBeDefined();
  });

  it('/POST Intersect custom with geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['verw_gem_f'],
      returnGeometry: true,
      fixGeometry: {
        type: 'Point',
        coordinates: [13.75, 51.07],
      },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect custom with geometry';
    await testStatus200(implName, result);

    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    expect(geojsonArray.length).toBe(1);
    const verwGemGeoJSON = geojsonArray[0];

    // test verw_kreis_f response
    expect(verwGemGeoJSON.geometry !== null).toBeTruthy();
    expect(verwGemGeoJSON.type).toBe('Feature');

    const props = verwGemGeoJSON.properties;
    expect(props['name']).toBe('Stadt Dresden');
    expect(props['__topic']).toBe('verw_gem_f');

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['timeout']).toBe(60000);
    expect(requestProps['returnGeometry']).toBe(true);
    expect(requestProps['outputFormat']).toBe('geojson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test geometry
    const geo = verwGemGeoJSON.geometry;
    expect(geo.type).toBe('Polygon');
    expect(geo.coordinates.length).toBeGreaterThan(0);
    const coordinates = geo.coordinates;
    expect(geo.coordinates.length).toBeGreaterThan(0);
    const coord = coordinates[0];
    expect(coord.length).toBeGreaterThan(0);
    const singleCoordinate = coord[0];
    // check approx. x and y coordinates
    expect(singleCoordinate.length).toBe(2);
    expect(singleCoordinate[0]).toBeGreaterThan(13);
    expect(singleCoordinate[0]).toBeLessThan(14);
    expect(singleCoordinate[1]).toBeGreaterThan(50);
    expect(singleCoordinate[1]).toBeLessThan(51);
  });

  it('/POST Intersect with esri input and output', async () => {
    const input = getEsriJSONFeature({
      returnGeometry: true,
      outputFormat: 'esrijson',
      topics: ['verw_kreis_f'],
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect custom with geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
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
    expect(requestProps['timeout']).toBe(60000);
    expect(requestProps['returnGeometry']).toBe(true);
    expect(requestProps['outSRS']).toBe('25833');
    expect(requestProps['outputFormat']).toBe('esrijson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test geometry
    const geo = verwEsri.geometry;
    expect(geo.spatialReference).toBeDefined();
    expect(geo.spatialReference.wkid).toBeDefined();
    expect(geo.spatialReference.wkid).toBe('25833');
    expect(geo.rings).toBeDefined();
    expect(geo.rings.length).toBeGreaterThan(0);
    const coordinates = geo.rings;
    expect(coordinates.length).toBeGreaterThan(0);
    // TODO after swagger update add tests for rigns with number[][][]
  });

  it('/POST Intersect with esri input and geojson output', async () => {
    const input = getEsriJSONFeature({
      returnGeometry: true,
      outputFormat: 'geojson',
      topics: ['verw_kreis_f'],
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect custom with geometry';
    await testStatus200(implName, result);

    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    expect(geojsonArray.length).toBe(1);
    const verwGemGeoJSON = geojsonArray[0];

    // test verw_kreis_f response
    expect(verwGemGeoJSON.geometry !== null).toBeTruthy();
    expect(verwGemGeoJSON.type).toBe('Feature');

    const props = verwGemGeoJSON.properties;
    expect(props['name']).toBe('Kreisfreie Stadt Dresden');
    expect(props['__topic']).toBe('verw_kreis_f');

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['timeout']).toBe(60000);
    expect(requestProps['returnGeometry']).toBe(true);
    expect(requestProps['outputFormat']).toBe('geojson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test geometry
    const geo = verwGemGeoJSON.geometry;
    expect(geo.type).toBe('Polygon');
    expect(geo.coordinates.length).toBeGreaterThan(0);
    const coordinates = geo.coordinates;
    expect(geo.coordinates.length).toBeGreaterThan(0);
    const coord = coordinates[0];
    expect(coord.length).toBeGreaterThan(0);
    const singleCoordinate = coord[0];
    // check approx. x and y coordinates
    expect(singleCoordinate.length).toBe(2);
    expect(singleCoordinate[0]).toBeGreaterThan(13);
    expect(singleCoordinate[0]).toBeLessThan(14);
    expect(singleCoordinate[1]).toBeGreaterThan(50);
    expect(singleCoordinate[1]).toBeLessThan(51);
  });
});
