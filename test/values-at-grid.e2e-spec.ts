import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import { createE2eTestModules } from './helpers/database.helper';
import { ValuesAtGridParameterDto } from '../src/general/dto/parameter.dto';
import { GeneralModule } from '../src/general/general.module';
import { TransformModule } from '../src/transform/transform.module';
import { ValuesAtGridController } from '../src/values-at-grid/values-at-grid.controller';
import { ValuesAtGridService } from '../src/values-at-grid/values-at-grid.service';
import {
  GET,
  HEADERS_JSON,
  POST,
  TOPIC_URL,
  URL_START,
  VALUES_AT_GRID,
  VALUES_AT_GRID_URL,
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

describe('ValuesAtGridController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtGridController],
      imports: [...createE2eTestModules(), GeneralModule, TransformModule],
      providers: [ValuesAtGridService],
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
      url: URL_START + VALUES_AT_GRID_URL + TOPIC_URL,
    });
    await testStatus200('/GET Topics', result);
  });

  it('/POST ValuesAtGrid without geometry', async () => {
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
      url: URL_START + VALUES_AT_GRID_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST ValuesAtGrid without geometry';
    await testStatus200(implName, result);

    const geoJSON = await getGeoJSONFeatureFromResponse(result);
    expect(geoJSON.length).toBe(2);
    await topicTest(VALUES_AT_GRID, geoJSON[0], 'hoehe_r');
    await topicTest(VALUES_AT_GRID, geoJSON[1], 'hoehe_r');
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
      url: URL_START + VALUES_AT_GRID_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    const implName = '/POST within custom without geometry';
    await testStatus200(implName, result);

    // test if there is an answer for both topics
    const geojsonArray = await getGeoJSONFeatureFromResponse(result);
    // Land has currently just on item! kreis_f 2 => 1+2=3
    expect(geojsonArray.length === 2);
    const valuesGeoJSON = geojsonArray[0];
    const domGeoJSON = geojsonArray[1];

    // test kreis response
    expect(valuesGeoJSON.geometry === null).toBeTruthy();
    expect(valuesGeoJSON.type).toBe('Feature');

    const props = valuesGeoJSON.properties;
    expect(props['__name']).toBe('gelaendehoehe_dgm');
    expect(props['__topic']).toBe('hoehe_r');
    expect(props['value']).toBe(248.86);
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
    expect(propsLand['value']).toBe(248.86);
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

  it('/POST valuesAtGrid with a LineString returns a value profile', async () => {
    const payload: ValuesAtGridParameterDto = {
      topics: ['hoehe_r'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [13.786, 51.063],
              [13.786, 51.06305],
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
      url: URL_START + VALUES_AT_GRID_URL,
      payload,
      headers: HEADERS_JSON,
    });

    await testStatus200('/POST valuesAtGrid LineString', result);

    const data = JSON.parse(result.payload) as any[];

    // hoehe_r has two configured sources: DGM and DOM.
    expect(data).toHaveLength(2);

    for (const feature of data) {
      expect(feature.type).toBe('Feature');
      expect(feature.geometry).toBeNull();

      const valueProfile = feature.properties.valueProfile;
      expect(valueProfile).toBeDefined();

      // Validate value statistics.
      const valueStats = valueProfile.valueStats;
      expect(valueStats).toBeDefined();

      expect(typeof valueStats.min).toBe('number');
      expect(typeof valueStats.max).toBe('number');
      expect(typeof valueStats.mean).toBe('number');

      expect(valueStats.min).toBeLessThanOrEqual(valueStats.mean);
      expect(valueStats.mean).toBeLessThanOrEqual(valueStats.max);

      // Validate the value profile points.
      const profilePoints = valueProfile.profilePoints;

      expect(Array.isArray(profilePoints)).toBe(true);
      expect(profilePoints.length).toBeGreaterThanOrEqual(2);

      const indices = profilePoints.map(
        (point: { index: number }) => point.index,
      );

      expect(indices).toEqual([...indices].sort((a, b) => a - b));

      for (const point of profilePoints) {
        expect(typeof point.index).toBe('number');
        expect(typeof point.value).toBe('number');
        expect(typeof point.isVertex).toBe('boolean');
        expect(typeof point.chainageMeters).toBe('number');
      }

      // The first and last profile points represent the line endpoints.
      expect(profilePoints[0].chainageMeters).toBe(0);

      expect(
        profilePoints[profilePoints.length - 1].chainageMeters,
      ).toBeGreaterThan(0);
    }

    // Verify that both configured data sources are returned.
    expect(data.map((feature) => feature.properties.__name).sort()).toEqual(
      ['gelaendehoehe_dgm', 'oberflaechenhoehe_dom'].sort(),
    );
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
      [14.384556, 50.985494],
      [14.487489, 51.006884],
      [14.432138, 50.953695],
      [14.384556, 50.985494],
    ];

    const postPolygon = (ring: number[][]) => {
      const payload: ValuesAtGridParameterDto = {
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
        url: URL_START + VALUES_AT_GRID_URL,
        payload,
        headers: HEADERS_JSON,
      });
    };

    const statsOf = (data: any[], sourceName: string) =>
      data.find((f) => f.properties?.__name === sourceName)?.properties
        ?.valueStats;

    it('/POST valuesAtGrid with a Polygon returns plausible value statistics for both sources', async () => {
      const result = await postPolygon(RECTANGLE_RING);
      await testStatus200('/POST valuesAtGrid Polygon', result);

      const data = JSON.parse(result.payload) as any[];
      expect(data).toHaveLength(2);

      for (const feature of data) {
        expect(feature.type).toBe('Feature');
        expect(feature.geometry).toBeNull();

        expect(feature.properties?.value).toBeUndefined();
        expect(feature.properties?.valueProfile).toBeUndefined();

        const stats = feature.properties?.valueStats;
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

    it('/POST valuesAtGrid with a Polygon only counts pixels inside the polygon (triangle ≈ half of its bounding rectangle)', async () => {
      const rectangleResult = await postPolygon(RECTANGLE_RING);
      const triangleResult = await postPolygon(TRIANGLE_RING);
      await testStatus200('/POST valuesAtGrid Rectangle', rectangleResult);
      await testStatus200('/POST valuesAtGrid Triangle', triangleResult);

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

    it('/POST valuesAtGrid with a Polygon outside the raster coverage returns empty statistics instead of failing', async () => {
      const result = await postPolygon(OUTSIDE_COVERAGE_RING);
      await testStatus200('/POST valuesAtGrid Polygon outside', result);

      const data = JSON.parse(result.payload) as any[];
      for (const feature of data) {
        const stats = feature.properties?.valueStats;
        expect(stats).toBeDefined();
        expect([null, 0]).toContain(stats.count);
        expect(stats.min).toBeNull();
        expect(stats.max).toBeNull();
      }
    });

    it('/POST valuesAtGrid with an unsupported geometry type is rejected with 400', async () => {
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
        url: URL_START + VALUES_AT_GRID_URL,
        payload,
        headers: HEADERS_JSON,
      });
      expect(result.statusCode).toBe(400);
    });
  });

  it('/POST valuesAtGrid with a Point keeps the existing response structure', async () => {
    const payload: ValuesAtGridParameterDto = {
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
      url: URL_START + VALUES_AT_GRID_URL,
      payload,
      headers: HEADERS_JSON,
    });

    await testStatus200('/POST valuesAtGrid Point regression', result);

    const data = JSON.parse(result.payload) as any[];

    expect(data).toHaveLength(2);

    for (const feature of data) {
      expect(feature.type).toBe('Feature');
      expect(feature.geometry).toBeNull();

      // Point requests continue to use the existing single value.
      expect(feature.properties?.value).toBeDefined();

      // The value profile is only expected for LineString requests.
      expect(feature.properties?.valueProfile).toBeUndefined();
    }
  });

  it(`should reject GeoJSON output with any SRS other than WGS 84`, async () => {
    const payload: ValuesAtGridParameterDto = {
      inputGeometries: [],
      outputFormat: 'geojson',
      outSRS: 12345,
      returnGeometry: false,
      topics: ['kreis_f'],
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + VALUES_AT_GRID_URL,
      payload,
      headers: HEADERS_JSON,
    });

    expect(result.statusCode).toBe(400);
  });
});
