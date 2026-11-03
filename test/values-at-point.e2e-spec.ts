import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import { GeneralModule } from '../src/general/general.module';
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

const TEST_POINT = [13.865, 51.0642];

describe('ValuesAtGridController (e2e)', () => {
  let app: NestFastifyApplication;

  const postGeoJSON = (payload: any) =>
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
        expect(properties.height).toBeDefined();
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
      const payload = {
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
        expect(feature.properties?.heightProfile).toBeUndefined();
        expect(feature.properties?.heightStats).toBeUndefined();
      }
    });
  });

  describe('LineString input', () => {
    it('returns a value profile and statistics for both sources', async () => {
      const payload = {
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

        const profile = feature.properties?.heightProfile;

        expect(profile).toBeDefined();
        expect(profile.heightStats).toBeDefined();
        expect(Array.isArray(profile.profilePoints)).toBe(true);
        expect(profile.profilePoints.length).toBeGreaterThanOrEqual(2);

        const stats = profile.heightStats;
        const points = profile.profilePoints;

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
      }

      expect(
        features.map((feature) => feature.properties.__name).sort(),
      ).toEqual(['gelaendehoehe_dgm', 'oberflaechenhoehe_dom'].sort());
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
      const payload = {
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
