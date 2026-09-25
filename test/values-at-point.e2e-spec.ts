import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import { createE2eTestModules } from './helpers/database.helper';
import { ValuesAtPointParameterDto } from '../src/general/dto/parameter.dto';
import { GeneralModule } from '../src/general/general.module';
import { TransformModule } from '../src/transform/transform.module';
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

describe('ValuesAtPointController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
      imports: [...createE2eTestModules(), GeneralModule, TransformModule],
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
      topics: ['hoehe_r'],
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
    await topicTest(VAlUES_AT_POINT, geoJSON[0], 'hoehe_r');
    await topicTest(VAlUES_AT_POINT, geoJSON[1], 'hoehe_r');
    await resultIsGeoJSONFeatureWithoutGeometry(result);
  });
  it('/POST within custom without geometry', async () => {
    const input = await getGeoJSONFeature({
      topics: ['hoehe_r'],
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
    expect(props['__name']).toBe('gelaendehoehe_dgm');
    expect(props['__topic']).toBe('hoehe_r');
    expect(props['height']).toBe(248.86);
    expect(props['__unit']).toBe('m');
    expect(props['__verticalDatum']).toBe('DHHN2016');
    expect(props['__attribution']).toEqual([
      {
        name: 'GeoSN',
        url: 'https://geomis.sachsen.de/geomis-client/?lang=de#/datasets/iso/a3dba5b2-0118-4d76-ab78-ba656a1b489e',
      },
    ]);

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
    expect(propsLand['__name']).toBe('oberflaechenhoehe_dom');
    expect(propsLand['__topic']).toBe('hoehe_r');
    expect(propsLand['height']).toBe(248.86);
    expect(propsLand['__unit']).toBe('m');
    expect(propsLand['__verticalDatum']).toBe('DHHN2016');
    expect(propsLand['__attribution']).toEqual([
      {
        name: 'GeoSN',
        url: 'https://geomis.sachsen.de/geomis-client/?lang=de#/datasets/iso/587d9a32-07ed-42dd-a207-3d0dfef7917c',
      },
    ]);

    const geoPropsLand = propsLand['__geoProperties'];
    const requestPropsLand = propsLand['__requestParams'];
    expect(requestPropsLand['returnGeometry']).toBe(false);
    expect(requestPropsLand['outputFormat']).toBe('geojson');

    expect(geoPropsLand['name']).toBe('testname');
    expect(geoPropsLand['test']).toBe(9);
    expect(geoPropsLand['__geometryIdentifier__']).toBeDefined();
  });

  it('/POST valuesAtPoint with a LineString returns a height profile', async () => {
    const payload: ValuesAtPointParameterDto = {
      topics: ['hoehe_r'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [13.786, 51.062],
              [13.788, 51.063],
            ],
          },
          properties: {},
        },
      ],
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload,
      headers: HEADERS_JSON,
    });

    await testStatus200('/POST valuesAtPoint LineString', result);

    const data = JSON.parse(result.payload) as any[];

    // hoehe_r has two configured sources: DGM and DOM.
    expect(data).toHaveLength(2);

    for (const feature of data) {
      expect(feature.type).toBe('Feature');
      expect(feature.geometry).toBeNull();

      const heights = feature.properties?.heights;

      expect(heights).toBeDefined();

      expect(typeof heights.min).toBe('number');
      expect(typeof heights.max).toBe('number');
      expect(typeof heights.avg).toBe('number');

      expect(heights.min).toBeLessThanOrEqual(heights.avg);
      expect(heights.avg).toBeLessThanOrEqual(heights.max);

      expect(Array.isArray(heights.points)).toBe(true);
      expect(heights.points.length).toBeGreaterThanOrEqual(2);

      const indices = heights.points.map(
        (point: { index: number }) => point.index,
      );

      const sortedIndices = [...indices].sort((a, b) => a - b);

      expect(indices).toEqual(sortedIndices);

      for (const point of heights.points) {
        expect(typeof point.index).toBe('number');
        expect(typeof point.height).toBe('number');
      }
    }
  });

  it('/POST valuesAtPoint with a Polygon is rejected with 400', async () => {
    const payload: ValuesAtPointParameterDto = {
      topics: ['hoehe_r'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [13.786, 51.062],
                [13.788, 51.062],
                [13.788, 51.064],
                [13.786, 51.062],
              ],
            ],
          },
          properties: {},
        },
      ],
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload,
      headers: HEADERS_JSON,
    });

    expect(result.statusCode).toBe(400);
  });

  it('/POST valuesAtPoint with a Point keeps the existing response structure', async () => {
    const payload: ValuesAtPointParameterDto = {
      topics: ['hoehe_r'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [13.7795, 51.0303],
          },
          properties: {},
        },
      ],
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload,
      headers: HEADERS_JSON,
    });

    await testStatus200('/POST valuesAtPoint Point regression', result);

    const data = JSON.parse(result.payload) as any[];

    expect(data).toHaveLength(2);

    for (const feature of data) {
      expect(feature.type).toBe('Feature');
      expect(feature.geometry).toBeNull();

      // Point requests continue to use the existing single height value.
      expect(feature.properties?.height).toBeDefined();

      // The height profile is only expected for LineString requests.
      expect(feature.properties?.heights).toBeUndefined();
    }
  });

  it(`should reject GeoJSON output with any SRS other than WGS 84`, async () => {
    const payload: ValuesAtPointParameterDto = {
      inputGeometries: [],
      outputFormat: 'geojson',
      outSRS: 12345,
      returnGeometry: false,
      topics: ['kreis_f'],
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload,
      headers: HEADERS_JSON,
    });

    expect(result.statusCode).toBe(400);
  });
});
