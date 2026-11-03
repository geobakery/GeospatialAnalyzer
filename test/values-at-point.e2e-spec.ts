import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { setUpOpenAPIAndValidation } from '../src/app-init';
import { createE2eTestModules } from './helpers/database.helper';
import { ValuesAtPointParameterDto } from '../src/general/dto/parameter.dto';
import { GeneralModule } from '../src/general/general.module';
import { DB_HEIGHT_NAME } from '../src/general/general.constants';
import { GeneralService } from '../src/general/general.service';
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

let dataSource: DataSource;
let adapter: any;
let source: { name: string; source: string; srid: number };

const TEST_POINT = [13.865, 51.0642];
const RAW_VALUE_AT_TESTPOINT = 248.86;

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

const valueAtPointRaw = async (places?: number) => {
  const point = `ST_Transform(
    'SRID=4326;POINT(13.865 51.0642)'::text,
    ${source.srid}
  )`;

  const expression = adapter.getValueAtFeature(
    { raw: true, value: point },
    { raw: true, value: 'rast' },
    places,
  );

  return Number(
    await run(
      expression,
      `FROM ${source.source}
       WHERE ST_Intersects(rast, ${point})
       LIMIT 1`,
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

describe('ValuesAtPointController (e2e)', () => {
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

  const expectRawRounded = (
    value: number,
    decimals: number | undefined,
    reference = RAW_VALUE_AT_TESTPOINT,
  ) => {
    expect(typeof value).toBe('number');

    if (decimals === undefined) {
      expect(value).toBe(reference);
      return;
    }

    expectRounded(value, decimals);

    expect(Math.abs(value - reference)).toBeLessThanOrEqual(
      0.5 * 10 ** -decimals + 1e-9,
    );
  };

  const postGeoJSON = (payload: ValuesAtPointParameterDto) =>
    app.inject({
      method: POST,
      url: URL_START + VALUES_AT_POINT_URL,
      payload,
      headers: HEADERS_JSON,
    });

  const expectFeatureWithoutGeometry = (feature: any) => {
    expect(feature.type).toBe('Feature');
    expect(feature.geometry).toBeNull();
  };

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
        url: URL_START + VALUES_AT_POINT_URL + TOPIC_URL,
      });

      await testStatus200('/GET Topics', result);
    });

    it('returns value metadata and attribution', async () => {
      const result = await app.inject({
        method: GET,
        url: URL_START + VALUES_AT_POINT_URL + TOPIC_URL,
      });

      await testStatus200('/GET Topics metadata', result);

      const topics = JSON.parse(result.payload);

      const topic = topics.find((item: any) =>
        item.identifiers.includes('hoehe_r'),
      );

      expect(topic).toBeDefined();

      // Metadata is optional and may be absent if not configured.
      if (topic.valueMetadata) {
        expect(topic.valueMetadata).toBeDefined();

        if (topic.valueMetadata.sources) {
          expect(topic.valueMetadata.sources.length).toBeGreaterThan(0);

          for (const item of topic.valueMetadata.sources) {
            expect(item.sourceName).toBeDefined();
          }
        }
      }

      if (topic.attribution) {
        expect(Array.isArray(topic.attribution)).toBe(true);
      }
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
        url: URL_START + VALUES_AT_POINT_URL,
        payload: input,
        headers: HEADERS_JSON,
      });

      await testStatus200('/POST ValuesAtPoint without geometry', result);

      const features = await getGeoJSONFeatureFromResponse(result);

      expect(features).toHaveLength(2);

      await topicTest(VAlUES_AT_POINT, features[0], 'hoehe_r');
      await topicTest(VAlUES_AT_POINT, features[1], 'hoehe_r');

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
        url: URL_START + VALUES_AT_POINT_URL,
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
        expectRawRounded(properties[DB_HEIGHT_NAME], decimalsFor(feature));

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

      const result = await postGeoJSON(payload);

      await testStatus200('/POST valuesAtPoint Point regression', result);

      const features = JSON.parse(result.payload) as any[];

      expect(features).toHaveLength(2);

      for (const feature of features) {
        expectFeatureWithoutGeometry(feature);
        expect(feature.properties?.[DB_HEIGHT_NAME]).toBeDefined();
        expect(feature.properties?.__profile).toBeUndefined();
        expect(feature.properties?.__stats).toBeUndefined();
      }
    });

    it('returns metadata for each individual source', async () => {
      const input = await getGeoJSONFeature({
        topics: ['hoehe_r'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: TEST_POINT,
        },
      });

      const result = await postGeoJSON(input);

      await testStatus200('/POST source metadata', result);

      const features = await getGeoJSONFeatureFromResponse(result);

      const sourceNames = features.map(
        (feature: any) => feature.properties.__name,
      );

      expect(sourceNames).toContain('gelaendehoehe_dgm');
      expect(sourceNames).toContain('oberflaechenhoehe_dom');

      for (const feature of features) {
        expect(feature.properties.__topic).toBe('hoehe_r');

        expect(feature.properties.__unit).toBe('m');
        expect(feature.properties.__verticalDatum).toBe('DHHN2016');

        expect(feature.properties.__attribution).toHaveLength(1);
        expect(feature.properties.__attribution[0].name).toBe('GeoSN');
      }
    });

    it('uses source metadata before topic-level fallback', async () => {
      const generalService = app.get(GeneralService);

      const sources = generalService.getMultipleDBNamesForIdentifier('hoehe_r');

      const topicMetadata =
        generalService.identifierValueMetadataMap.get('hoehe_r');

      expect(sources.length).toBe(2);

      for (const item of sources) {
        const decimalPlaces =
          item.decimalPlaces ?? topicMetadata?.decimalPlaces;

        expect(
          decimalPlaces === undefined ||
            (Number.isInteger(decimalPlaces) && decimalPlaces >= 0),
        ).toBe(true);

        const unit = item.unit ?? topicMetadata?.unit;
        const verticalDatum =
          item.verticalDatum ?? topicMetadata?.verticalDatum;

        expect(unit).toBe('m');
        expect(verticalDatum).toBe('DHHN2016');
      }
    });
  });

  describe('decimalPlaces rounding in the database', () => {
    let valueReference: number;

    beforeAll(async () => {
      valueReference = await valueAtPointRaw();
    });

    it('has data for the test point', () => {
      expect(typeof valueReference).toBe('number');
      expect(Number.isFinite(valueReference)).toBe(true);
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

      it('accepts zero decimal places', async () => {
        const result = await run(adapter.roundValue('2.5', 0));

        expect(Number(result)).toBe(3);
      });
    });

    describe('roundValue validation', () => {
      it.each([-1, 1.5, -0.5, NaN, Infinity])(
        'rejects invalid decimalPlaces: %s',
        (places) => {
          expect(() => adapter.roundValue('1.2345', places)).toThrow(
            'decimalPlaces must be an integer >= 0',
          );
        },
      );
    });

    describe.each([0, 1, 2, 3])('with %i decimal places', (places) => {
      it('rounds the value at a point', async () => {
        expectRoundedTo(await valueAtPointRaw(places), valueReference, places);
      });
    });

    it('rounds values individually for each configured source', async () => {
      const input = await getGeoJSONFeature({
        topics: ['hoehe_r'],
        returnGeometry: false,
        fixGeometry: {
          type: 'Point',
          coordinates: TEST_POINT,
        },
      });

      const result = await postGeoJSON(input);

      await testStatus200('/POST values with source rounding', result);

      const features = await getGeoJSONFeatureFromResponse(result);

      expect(features).toHaveLength(2);

      for (const feature of features) {
        const decimalPlaces = decimalsFor(feature);
        const value = feature.properties[DB_HEIGHT_NAME];

        expectRawRounded(value, decimalPlaces);
      }
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
        url: URL_START + VALUES_AT_POINT_URL,
        payload,
        headers: HEADERS_JSON,
      });

      expect(result.statusCode).toBe(400);
    });

    it('rejects GeoJSON output with an SRS other than WGS 84', async () => {
      const payload: ValuesAtPointParameterDto = {
        inputGeometries: [],
        outputFormat: 'geojson',
        outSRS: 12345,
        returnGeometry: false,
        topics: ['kreis_f'],
      };

      const result = await postGeoJSON(payload);

      expect(result.statusCode).toBe(400);
    });

    it('rejects unsupported topics', async () => {
      const payload: ValuesAtPointParameterDto = {
        topics: ['unknown_topic'],
        inputGeometries: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: TEST_POINT,
            },
            properties: {},
          },
        ],
        outputFormat: 'geojson',
        returnGeometry: false,
        outSRS: 4326,
      };

      const result = await postGeoJSON(payload);

      expect(result.statusCode).toBe(400);
    });
  });
});
