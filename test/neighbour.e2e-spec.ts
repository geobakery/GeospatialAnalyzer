import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import { createE2eTestModules } from './helpers/database.helper';
import { EsriPolygonDto } from '../src/general/dto/esri-geometry.dto';
import { NearestNeighbourParameterDto } from '../src/general/dto/parameter.dto';
import { DB_DIST_NAME } from '../src/general/general.constants';
import { GeneralModule } from '../src/general/general.module';
import { NearestNeighbourController } from '../src/nearest-neighbour/nearest-neighbour.controller';
import { NearestNeighbourService } from '../src/nearest-neighbour/nearest-neighbour.service';
import { TransformModule } from '../src/transform/transform.module';
import {
  GET,
  HEADERS_JSON,
  INTERSECT,
  NEAREST_URL,
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
  testStatus400,
  topicTest,
} from './common/test';
import {
  getEsriJSONFeature,
  getGeoJSONFeature,
} from './common/testDataPreparer';

describe('NearestNeighbourController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
      imports: [
        ...createE2eTestModules(),
        GeneralModule,
        TransformModule,
      ],
      providers: [NearestNeighbourService],
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
      url: URL_START + NEAREST_URL + TOPIC_URL,
    });
    await testStatus200('/GET Topics', result);
  });

  it('/POST Nearest neighbour with geometry', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getGeoJSONFeature({
        topics: ['kreis'],
        returnGeometry: true,
        fixGeometry: {
          type: 'Point',
          coordinates: [15.75, 51.072],
        },
      }),
      count: 2,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Nearest neighbour with geometry';
    await testStatus200(implName, result);

    const geoJSON = await getGeoJSONFeatureFromResponse(result);
    console.log(geoJSON);
    expect(geoJSON.length).toBe(2);
    await topicTest(INTERSECT, geoJSON[0], 'kreis');
    await resultIsGeoJSONFeatureWithGeometry(result, 'Polygon');
  });

  it('/POST Nearest neighbour without geometry', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getGeoJSONFeature({
        topics: ['kreis'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: [15.75, 51.072],
        },
      }),
      count: 2,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Intersect without geometry';
    await testStatus200(implName, result);
    await resultIsGeoJSONFeatureWithoutGeometry(result);
  });

  it('/POST Nearest neighbour custom without geometry', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getGeoJSONFeature({
        topics: ['kreis', 'land'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: [15.746, 51.072],
        },
      }),
      count: 2,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Nearest neighbour custom without geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    // Land has currently just on item! kreis_f 2 => 1+2=3
    expect(geojsonArray.length === 3);
    const verwKreisGeoJSON = geojsonArray[0];
    const verwKreisGeoJSON1 = geojsonArray[1];
    const verwLandGeoJSON = geojsonArray[2];

    // test kreis response
    expect(verwKreisGeoJSON.geometry === null).toBeTruthy();
    expect(verwKreisGeoJSON.type).toBe('Feature');
    expect(verwKreisGeoJSON1.geometry === null).toBeTruthy();
    expect(verwKreisGeoJSON1.type).toBe('Feature');

    const props = verwKreisGeoJSON.properties;
    expect(props['name']).toBe('Landkreis Bautzen');
    expect(props['__topic']).toBe('kreis');
    // approx result
    expect(props[DB_DIST_NAME]).toBeGreaterThan(74076);
    expect(props[DB_DIST_NAME]).toBeLessThan(74077);

    const props1 = verwKreisGeoJSON1.properties;
    expect(props1['name']).toBe('Landkreis Sächsische Schweiz-Osterzgebirge');
    expect(props1['__topic']).toBe('kreis');
    // approx result
    expect(props1[DB_DIST_NAME]).toBeGreaterThan(95639);
    expect(props1[DB_DIST_NAME]).toBeLessThan(95640);

    const geoProps = props['__geoProperties'];
    const requestProps = props['__requestParams'];
    expect(requestProps['returnGeometry']).toBe(false);
    expect(requestProps['outputFormat']).toBe('geojson');

    expect(geoProps['name']).toBe('testname');
    expect(geoProps['test']).toBe(9);
    expect(geoProps['__geometryIdentifier__']).toBeDefined();

    // test land response
    expect(verwLandGeoJSON.geometry === null).toBeTruthy();
    expect(verwLandGeoJSON.type).toBe('Feature');

    const propsLand = verwLandGeoJSON.properties;
    expect(propsLand['name']).toBe('Sachsen');
    expect(propsLand['__topic']).toBe('land');
    expect(propsLand[DB_DIST_NAME]).toBeGreaterThan(52689);
    expect(propsLand[DB_DIST_NAME]).toBeLessThan(52690);

    const geoPropsLand = propsLand['__geoProperties'];
    const requestPropsLand = propsLand['__requestParams'];
    expect(requestPropsLand['returnGeometry']).toBe(false);
    expect(requestPropsLand['outputFormat']).toBe('geojson');

    expect(geoPropsLand['name']).toBe('testname');
    expect(geoPropsLand['test']).toBe(9);
    expect(geoPropsLand['__geometryIdentifier__']).toBeDefined();
  });

  it('/POST Nearest neighbour with esri input and output', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getEsriJSONFeature({
        returnGeometry: true,
        outputFormat: 'esrijson',
        topics: ['kreis'],
      }),
      count: 1,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Nearest neighbour custom with geometry';
    await testStatus200(implName, result);

    const esrijsonArray = await getESRISONFeatureFromResponse(result);
    expect(esrijsonArray.length).toBe(1);
    const verwEsri = esrijsonArray[0];

    // test kreis response
    expect(verwEsri.geometry).toBeDefined();
    expect(verwEsri.attributes).toBeDefined();

    const props = verwEsri.attributes;
    expect(props['name']).toBe('Kreisfreie Stadt Dresden');
    expect(props['__topic']).toBe('kreis');

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
    expect((geo as EsriPolygonDto).rings).toBeDefined();
    const coordinates = (geo as EsriPolygonDto).rings;
    expect(coordinates).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([expect.arrayContaining([expect.any(Number)])]),
      ]),
    );
  });

  it('/POST Nearest neighbour without count', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getEsriJSONFeature({
        returnGeometry: false,
        outputFormat: 'esrijson',
        topics: ['kreis'],
      }),
      count: 0,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Nearest neighbour custom with geometry';
    await testStatus200(implName, result);
  });

  it('/POST Nearest neighbour with false topic', async () => {
    const input: NearestNeighbourParameterDto = {
      ...getEsriJSONFeature({
        returnGeometry: false,
        outputFormat: 'esrijson',
        topics: ['verw_test_f'],
      }),
      count: 1,
      maxDistanceToNeighbour: 0,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST Nearest neighbour custom with geometry';
    await testStatus400(implName, result);

    const data = JSON.parse(result.payload);
    expect(data).toBeDefined();
    expect(data.message).toContain('Unsupported topic');
  });

  it(`should reject GeoJSON output with any SRS other than WGS 84`, async () => {
    const payload: NearestNeighbourParameterDto = {
      count: 1,
      inputGeometries: [],
      maxDistanceToNeighbour: 0,
      outputFormat: 'geojson',
      outSRS: 12345,
      returnGeometry: false,
      topics: ['kreis'],
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload,
      headers: HEADERS_JSON,
    });

    expect(result.statusCode).toBe(400);
  });
});
