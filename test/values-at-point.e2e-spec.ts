import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import {
  DB_VALUE_NAME,
  DB_VALUE_PROFILE_NAME,
  DB_VALUE_STATS_NAME,
} from '../src/general/general.constants';
import { GeneralModule } from '../src/general/general.module';
import { GeneralService } from '../src/general/general.service';
import { ValuesAtGridParameterDto } from '../src/general/dto/parameter.dto';
import { TransformModule } from '../src/transform/transform.module';
import { ValuesAtGridController } from '../src/values-at-point/values-at-point.controller';
import { ValuesAtGridService } from '../src/values-at-point/values-at-point.service';
import {
  GET,
  HEADERS_JSON,
  POST,
  TOPIC_URL,
  URL_START,
  VAlUES_AT_GRID,
  VALUES_AT_GRID_URL,
} from './common/constants';
import {
  getGeoJSONFeatureFromResponse,
  resultIsGeoJSONFeatureWithoutGeometry,
  testStatus200,
  topicTest,
} from './common/test';
import { getGeoJSONFeature } from './common/testDataPreparer';
import { createE2eTestModules } from './helpers/database.helper';

let dataSource: DataSource;
let adapter: any;
let source: { name: string; source: string; srid: number };

const TEST_POINT = [13.865, 51.0642];
const RAW_VALUE_AT_TESTPOINT = 248.86;

const lineStats = (feature: any) =>
  feature.properties?.[DB_VALUE_PROFILE_NAME]?.heightStats;

const lineProfilePoints = (feature: any) =>
  feature.properties?.[DB_VALUE_PROFILE_NAME]?.profilePoints;

const polygonStats = (feature: any) =>
  feature.properties?.[DB_VALUE_STATS_NAME];

const hasAtMostDecimals = (value: number, decimals: number) =>
  Number(value.toFixed(decimals)) === value;

const expectRounded = (value: unknown, decimals: number | undefined) => {
  if (decimals === undefined) return;

  expect(typeof value).toBe('number');
  expect(hasAtMostDecimals(value as number, decimals)).toBe(true);
};

const run = async (expression: string, from = '') => {
  const [row] = await dataSource.query(
    `SELECT ${expression} AS result ${from}`,
  );
  return row.result;
};

const polygonStatsRaw = (places?: number) =>
  run(
    adapter.getPolygonValueStats(
      {
        raw: true,
        value:
          "'SRID=4326;POLYGON((13.8649 51.0641, 13.8651 51.0641, 13.8651 51.0643, 13.8649 51.0643, 13.8649 51.0641))'",
      },
      source.source,
      source.name,
      source.srid,
      places,
    ),
  );

const lineProfileRaw = async (places?: number) => {
  const result = await run(
    adapter.getLineValueProfile(
      {
        raw: true,
        value: "'SRID=4326;LINESTRING(13.8650 51.0640, 13.8670 51.0650)'",
      },
      { raw: true, value: '10' },
      source.source,
      source.name,
      source.srid,
      places,
    ),
  );

  result.profilePoints.sort((a: any, b: any) => a.index - b.index);

  return result;
};

const valueAtPointRaw = async (places?: number) => {
  const point = `ST_Transform('SRID=4326;POINT(13.865 51.0642)'::text, ${source.srid})`;

  const expression = adapter.getValueAtFeature(
    { raw: true, value: point },
    { raw: true, value: 'rast' },
    places,
  );

  return Number(
    await run(
      expression,
      `FROM ${source.source} WHERE ST_Intersects(rast, ${point}) LIMIT 1`,
    ),
  );
};

const expectRoundedTo = (
  rounded: number,
  reference: number,
  decimals: number,
) => {
  expect(typeof rounded).toBe('number');
  expect(hasAtMostDecimals(rounded, decimals)).toBe(true);
  expect(Math.abs(rounded - reference)).toBeLessThanOrEqual(
    0.5 * 10 ** -decimals + 1e-6,
  );
};

describe('ValuesAtGridController (e2e)', () => {
  let app: NestFastifyApplication;

  const decimalsFor = (feature: any): number | undefined => {
    const generalService = app.get(GeneralService);

    const source = generalService
      .getMultipleDBNamesForIdentifier('hoehe_r')
      .find((item) => item.name === feature.properties?.__name);

    return (
      source?.decimalPlaces ??
      generalService.identifierValueMetadataMap.get('hoehe_r')?.decimalPlaces
    );
  };

  const expectRawRounded = (value: number, decimals: number | undefined) => {
    expect(typeof value).toBe('number');

    if (decimals === undefined) {
      expect(value).toBe(RAW_VALUE_AT_TESTPOINT);
      return;
    }

    expectRounded(value, decimals);
    expect(Math.abs(value - RAW_VALUE_AT_TESTPOINT)).toBeLessThanOrEqual(
      0.5 * 10 ** -decimals + 1e-9,
    );
  };

  const postGeoJSON = (payload: ValuesAtGridParameterDto) =>
    app.inject({
      method: POST,
      url: URL_START + VALUES_AT_GRID_URL,
      payload,
      headers: HEADERS_JSON,
    });

  const expectFeatureWithoutGeometry = (feature: any) => {
    expect(feature.type).toBe('Feature');
    expect(feature.geometry).toBeNull();
  };

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

    dataSource = app.get(DataSource);

    const generalService = app.get(GeneralService);
    adapter = generalService.adapter;
    source = generalService.getMultipleDBNamesForIdentifier('hoehe_r')[0];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET topics', () => {
    it('returns status 200', async () => {
      const result = await app.inject({
        method: GET,
        url: URL_START + VALUES_AT_GRID_URL + TOPIC_URL,
      });

      await testStatus200('/GET Topics', result);
    });
  });

  describe('Point input', () => {
    it('returns values for both configured sources without geometry', async () => {
      const input = await getGeoJSONFeature({
        topics: ['hoehe_r'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: TEST_POINT,
        },
      });

      const result = await app.inject({
        method: POST,
        url: URL_START + VALUES_AT_GRID_URL,
        payload: input,
        headers: HEADERS_JSON,
      });

      await testStatus200('/POST ValuesAtPoint without geometry', result);

      const features = await getGeoJSONFeatureFromResponse(result);

      expect(features).toHaveLength(2);

      await topicTest(VAlUES_AT_GRID, features[0], 'hoehe_r');
      await topicTest(VAlUES_AT_GRID, features[1], 'hoehe_r');

      await resultIsGeoJSONFeatureWithoutGeometry(result);
    });

    it('returns the expected metadata for both sources', async () => {
      const input = await getGeoJSONFeature({
        topics: ['hoehe_r'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: TEST_POINT,
        },
      });

      const result = await app.inject({
        method: POST,
        url: URL_START + VALUES_AT_GRID_URL,
        payload: input,
        headers: HEADERS_JSON,
      });

      await testStatus200('/POST within custom without geometry', result);

      const features = await getGeoJSONFeatureFromResponse(result);

      expect(features).toHaveLength(2);

      const expectedSources = [
        {
          name: 'gelaendehoehe_dgm',
          attribution: {
            name: 'GeoSN',
            url: 'https://geomis.sachsen.de/geomis-client/?lang=de#/datasets/iso/a3dba5b2-0118-4d76-ab78-ba656a1b489e',
          },
        },
        {
          name: 'oberflaechenhoehe_dom',
          attribution: {
            name: 'GeoSN',
            url: 'https://geomis.sachsen.de/geomis-client/?lang=de#/datasets/iso/587d9a32-07ed-42dd-a207-3d0dfef7917c',
          },
        },
      ];

      for (const expected of expectedSources) {
        const feature = features.find(
          (item: any) => item.properties.__name === expected.name,
        );

        expect(feature).toBeDefined();
        expectFeatureWithoutGeometry(feature);

        const properties = feature.properties;

        expect(properties.__topic).toBe('hoehe_r');
        expectRawRounded(properties[DB_VALUE_NAME], decimalsFor(feature));
        expect(properties.__unit).toBe('m');
        expect(properties.__verticalDatum).toBe('DHHN2016');
        expect(properties.__attribution).toEqual([expected.attribution]);

        expect(properties.__requestParams).toMatchObject({
          returnGeometry: false,
          outputFormat: 'geojson',
        });

        expect(properties.__geoProperties).toMatchObject({
          name: 'testname',
          test: 9,
        });

        expect(properties.__geoProperties.__geometryIdentifier__).toBeDefined();
      }
    });

    it('preserves the existing response structure for Point requests', async () => {
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

      const result = await postGeoJSON(payload);

      await testStatus200('/POST valuesAtPoint Point regression', result);

      const features = JSON.parse(result.payload) as any[];

      expect(features).toHaveLength(2);

      for (const feature of features) {
        expectFeatureWithoutGeometry(feature);
        expect(feature.properties?.height).toBeDefined();
        expect(feature.properties?.[DB_VALUE_PROFILE_NAME]).toBeUndefined();
        expect(feature.properties?.[DB_VALUE_STATS_NAME]).toBeUndefined();
      }
    });
  });

  describe('LineString input', () => {
    it('returns a value profile and rounded statistics for both sources', async () => {
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

      const result = await postGeoJSON(payload);

      await testStatus200('/POST valuesAtPoint LineString', result);

      const features = JSON.parse(result.payload) as any[];

      expect(features).toHaveLength(2);

      for (const feature of features) {
        expectFeatureWithoutGeometry(feature);

        const stats = lineStats(feature);
        const points = lineProfilePoints(feature);

        expect(stats).toBeDefined();
        expect(Array.isArray(points)).toBe(true);
        expect(points.length).toBeGreaterThanOrEqual(2);

        expect(stats.points_count).toBe(points.length);
        expect(stats.points_haveValue + stats.points_noValue).toBe(
          stats.points_count,
        );

        for (const key of ['min', 'max', 'mean', 'sum']) {
          expect(typeof stats[key]).toBe('number');
        }

        expect(stats.min).toBeLessThanOrEqual(stats.mean);
        expect(stats.mean).toBeLessThanOrEqual(stats.max);

        const indices = points.map((point: { index: number }) => point.index);

        expect(indices).toEqual([...indices].sort((a, b) => a - b));

        const decimals = decimalsFor(feature);

        for (const key of ['min', 'max', 'mean', 'sum']) {
          expectRounded(stats[key], decimals);
        }

        expectRounded(
          stats.stddev,
          decimals === undefined ? undefined : decimals + 1,
        );

        for (const point of points) {
          if (typeof point.height === 'number') {
            expectRounded(point.height, decimals);
          }
        }
      }

      expect(
        features.map((feature) => feature.properties.__name).sort(),
      ).toEqual(['gelaendehoehe_dgm', 'oberflaechenhoehe_dom'].sort());
    });
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

    const postPolygon = (ring: number[][]) =>
      postGeoJSON({
        topics: ['hoehe_r'],
        inputGeometries: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
            properties: {},
          },
        ],
        outputFormat: 'geojson',
        returnGeometry: false,
        outSRS: 4326,
      });

    const statsOf = (features: any[], sourceName: string) =>
      polygonStats(
        features.find((feature) => feature.properties?.__name === sourceName),
      );

    it('returns plausible statistics for both sources', async () => {
      const result = await postPolygon(RECTANGLE_RING);

      await testStatus200('/POST valuesAtGrid Polygon', result);

      const features = JSON.parse(result.payload) as any[];

      expect(features).toHaveLength(2);

      for (const feature of features) {
        expectFeatureWithoutGeometry(feature);

        expect(feature.properties?.[DB_VALUE_NAME]).toBeUndefined();
        expect(feature.properties?.[DB_VALUE_PROFILE_NAME]).toBeUndefined();

        const stats = polygonStats(feature);
        const decimals = decimalsFor(feature);
        const unit = decimals === undefined ? 1e-6 : 10 ** -decimals;

        expect(stats).toBeDefined();
        expect(Number.isInteger(stats.pixel_haveValue)).toBe(true);
        expect(stats.pixel_haveValue).toBeGreaterThan(0);

        expect(stats.min).toBeLessThanOrEqual(stats.mean);
        expect(stats.mean).toBeLessThanOrEqual(stats.max);
        expect(stats.stddev).toBeGreaterThanOrEqual(0);

        // Sum and mean are rounded independently.
        expect(
          Math.abs(stats.sum - stats.mean * stats.pixel_haveValue),
        ).toBeLessThanOrEqual(0.5 * unit * (stats.pixel_haveValue + 1) + 1e-6);

        for (const key of ['min', 'max', 'sum', 'mean']) {
          expectRounded(stats[key], decimals);
        }

        expectRounded(
          stats.stddev,
          decimals === undefined ? undefined : decimals + 1,
        );

        // The test point lies inside the polygon.
        expect(stats.min - 0.5 * unit).toBeLessThanOrEqual(
          RAW_VALUE_AT_TESTPOINT,
        );
        expect(stats.max + 0.5 * unit).toBeGreaterThanOrEqual(
          RAW_VALUE_AT_TESTPOINT,
        );
      }

      expect(statsOf(features, 'gelaendehoehe_dgm')).toBeDefined();
      expect(statsOf(features, 'oberflaechenhoehe_dom')).toBeDefined();
    });

    it('counts only pixels inside the polygon', async () => {
      const rectangleResult = await postPolygon(RECTANGLE_RING);
      const triangleResult = await postPolygon(TRIANGLE_RING);

      await testStatus200('/POST valuesAtGrid Rectangle', rectangleResult);
      await testStatus200('/POST valuesAtGrid Triangle', triangleResult);

      const rectangleFeatures = JSON.parse(rectangleResult.payload);
      const triangleFeatures = JSON.parse(triangleResult.payload);

      const rectangleCount = statsOf(
        rectangleFeatures,
        'gelaendehoehe_dgm',
      ).pixel_haveValue;

      const triangleCount = statsOf(
        triangleFeatures,
        'gelaendehoehe_dgm',
      ).pixel_haveValue;

      const ratio = triangleCount / rectangleCount;

      // The triangle covers approximately half the rectangle.
      expect(ratio).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(0.6);
    });

    it('returns empty statistics outside raster coverage', async () => {
      const result = await postPolygon(OUTSIDE_COVERAGE_RING);

      await testStatus200('/POST valuesAtGrid Polygon outside', result);

      const features = JSON.parse(result.payload) as any[];

      for (const feature of features) {
        const stats = polygonStats(feature);

        expect(stats).toBeDefined();
        expect([null, 0]).toContain(stats.pixel_haveValue);
        expect(stats.min).toBeNull();
        expect(stats.max).toBeNull();
      }
    });
  });

  describe('decimalPlaces rounding in the database', () => {
    let polygonReference: any;
    let lineReference: any;
    let valueReference: number;

    beforeAll(async () => {
      polygonReference = await polygonStatsRaw();
      lineReference = await lineProfileRaw();
      valueReference = await valueAtPointRaw();
    });

    it('has data for the test geometries', () => {
      expect(polygonReference.pixel_haveValue).toBeGreaterThan(0);
      expect(lineReference.heightStats.points_haveValue).toBeGreaterThan(0);
      expect(typeof valueReference).toBe('number');
    });

    describe('rounding semantics', () => {
      it.each([
        ['1.2355', 3, 1.236],
        ['1.2344', 3, 1.234],
        ['2.5', 0, 3],
        ['-2.5', 0, -3],
        ['0.05', 1, 0.1],
        ['0.04', 1, 0],
        ['248.86::float8', 1, 248.9],
        ['248.86::float8', 0, 249],
      ])('rounds %s to %i places to %d', async (literal, places, expected) => {
        const result = await run(adapter.roundValue(literal, places));

        expect(Number(result)).toBe(expected);
      });

      it('leaves the expression untouched without decimalPlaces', async () => {
        const result = await run(adapter.roundValue('1.23456789::float8'));

        expect(Number(result)).toBe(1.23456789);
      });
    });

    describe.each([0, 1, 2, 3])('with %i decimal places', (places) => {
      it('rounds the value at a point', async () => {
        expectRoundedTo(await valueAtPointRaw(places), valueReference, places);
      });

      it('rounds the polygon statistics', async () => {
        const stats = await polygonStatsRaw(places);

        expect(stats.pixel_haveValue).toBe(polygonReference.pixel_haveValue);
        expect(Number.isInteger(stats.pixel_haveValue)).toBe(true);

        for (const key of ['min', 'max', 'sum', 'mean']) {
          expectRoundedTo(stats[key], polygonReference[key], places);
        }

        expectRoundedTo(stats.stddev, polygonReference.stddev, places + 1);
      });

      it('rounds the line statistics and profile points', async () => {
        const result = await lineProfileRaw(places);
        const stats = result.heightStats;
        const reference = lineReference.heightStats;

        for (const key of [
          'points_count',
          'points_haveValue',
          'points_noValue',
        ]) {
          expect(stats[key]).toBe(reference[key]);
        }

        for (const key of ['min', 'max', 'sum', 'mean']) {
          expectRoundedTo(stats[key], reference[key], places);
        }

        expectRoundedTo(stats.stddev, reference.stddev, places + 1);

        expect(result.profilePoints).toHaveLength(
          lineReference.profilePoints.length,
        );

        result.profilePoints.forEach((point: any, i: number) => {
          const expected = lineReference.profilePoints[i];

          expect(point.index).toBe(expected.index);
          expect(point.isVertex).toBe(expected.isVertex);
          expect(point.chainageMeters).toBe(expected.chainageMeters);

          if (expected.height === null) {
            expect(point.height).toBeNull();
          } else {
            expectRoundedTo(point.height, expected.height, places);
          }
        });
      });
    });
  });

  describe('Request validation', () => {
    it('rejects unsupported geometry types with status 400', async () => {
      const payload = {
        topics: ['hoehe_r'],
        inputGeometries: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [],
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

      expect(result.statusCode).toBe(400);
    });

    it('rejects GeoJSON output with an SRS other than WGS 84', async () => {
      const payload: ValuesAtGridParameterDto = {
        inputGeometries: [],
        outputFormat: 'geojson',
        outSRS: 12345,
        returnGeometry: false,
        topics: ['kreis_f'],
      };

      const result = await postGeoJSON(payload);

      expect(result.statusCode).toBe(400);
    });
  });
});
