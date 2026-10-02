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

const hasAtMostDecimals = (value: number, decimals: number) =>
  Number(value.toFixed(decimals)) === value;

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
      expect(typeof heights.mean).toBe('number');

      expect(hasAtMostDecimals(heights.mean, 2)).toBe(true);

      expect(heights.min).toBeLessThanOrEqual(heights.mean);
      expect(heights.mean).toBeLessThanOrEqual(heights.max);

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

  describe('Polygon input', () => {
    const RECTANGLE_RING = [
      [13.864, 51.063],
      [13.866, 51.063],
      [13.866, 51.065],
      [13.864, 51.065],
      [13.864, 51.063],
    ];

    const TRIANGLE_RING = [
      [13.864, 51.063],
      [13.866, 51.063],
      [13.864, 51.065],
      [13.864, 51.063],
    ];

    const OUTSIDE_COVERAGE_RING = [
      [13.4, 52.52],
      [13.4002, 52.52],
      [13.4002, 52.5202],
      [13.4, 52.5202],
      [13.4, 52.52],
    ];

    const postPolygon = (ring: number[][]) => {
      const payload: ValuesAtPointParameterDto = {
        topics: ['hoehe_r'],
        inputGeometries: [
          {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [ring] },
            properties: {},
          },
        ],
        outputFormat: 'geojson',
        returnGeometry: false,
        outSRS: 4326,
      };
      return app.inject({
        method: POST,
        url: URL_START + VALUES_AT_POINT_URL,
        payload,
        headers: HEADERS_JSON,
      });
    };

    const statsOf = (data: any[], sourceName: string) =>
      data.find((f) => f.properties?.__name === sourceName)?.properties
        ?.heightStats;

    it('/POST valuesAtPoint with a Polygon returns plausible height statistics for both sources', async () => {
      const result = await postPolygon(RECTANGLE_RING);
      await testStatus200('/POST valuesAtPoint Polygon', result);

      const data = JSON.parse(result.payload) as any[];
      expect(data).toHaveLength(2);

      for (const feature of data) {
        expect(feature.type).toBe('Feature');
        expect(feature.geometry).toBeNull();

        expect(feature.properties?.height).toBeUndefined();
        expect(feature.properties?.heights).toBeUndefined();

        const stats = feature.properties?.heightStats;
        expect(stats).toBeDefined();

        expect(Number.isInteger(stats.count)).toBe(true);
        expect(stats.count).toBeGreaterThan(0);

        expect(stats.min).toBeLessThanOrEqual(stats.mean);
        expect(stats.mean).toBeLessThanOrEqual(stats.max);
        expect(stats.stddev).toBeGreaterThanOrEqual(0);
        expect(
          Math.abs(stats.sum - stats.mean * stats.count),
        ).toBeLessThanOrEqual(0.005 * (stats.count + 1));

        // The test point in the center of the polygon has an elevation of 248.86 according to the
        // existing point test and must therefore fall within the value range of the statistics.
        expect(stats.min).toBeLessThanOrEqual(248.86);
        expect(stats.max).toBeGreaterThanOrEqual(248.86);

        expect(hasAtMostDecimals(stats.sum, 2)).toBe(true);
        expect(hasAtMostDecimals(stats.mean, 2)).toBe(true);
        expect(hasAtMostDecimals(stats.stddev, 3)).toBe(true);
      }

      expect(statsOf(data, 'gelaendehoehe_dgm')).toBeDefined();
      expect(statsOf(data, 'oberflaechenhoehe_dom')).toBeDefined();
    });

    it('/POST valuesAtPoint with a Polygon only counts pixels inside the polygon (triangle ≈ half of its bounding rectangle)', async () => {
      const rectangleResult = await postPolygon(RECTANGLE_RING);
      const triangleResult = await postPolygon(TRIANGLE_RING);
      await testStatus200('/POST valuesAtPoint Rectangle', rectangleResult);
      await testStatus200('/POST valuesAtPoint Triangle', triangleResult);

      const rectangleCount = statsOf(
        JSON.parse(rectangleResult.payload),
        'gelaendehoehe_dgm',
      ).count;
      const triangleCount = statsOf(
        JSON.parse(triangleResult.payload),
        'gelaendehoehe_dgm',
      ).count;

      const ratio = triangleCount / rectangleCount;
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });

    it('/POST valuesAtPoint with a Polygon outside the raster coverage returns empty statistics instead of failing', async () => {
      const result = await postPolygon(OUTSIDE_COVERAGE_RING);
      await testStatus200('/POST valuesAtPoint Polygon outside', result);

      const data = JSON.parse(result.payload) as any[];
      for (const feature of data) {
        const stats = feature.properties?.heightStats;
        expect(stats).toBeDefined();
        expect([null, 0]).toContain(stats.count);
        expect(stats.min).toBeNull();
        expect(stats.max).toBeNull();
      }
    });

    it('/POST valuesAtPoint with an unsupported geometry type is rejected with 400', async () => {
      const payload = {
        topics: ['hoehe_r'],
        inputGeometries: [
          {
            type: 'Feature',
            geometry: { type: 'MultiPolygon', coordinates: [] },
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
