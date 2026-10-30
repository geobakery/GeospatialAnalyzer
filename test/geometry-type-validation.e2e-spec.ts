import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import { GeneralModule } from '../src/general/general.module';
import { createE2eTestModules } from './helpers/database.helper';
import { TransformModule } from '../src/transform/transform.module';
import { IntersectController } from '../src/intersect/intersect.controller';
import { IntersectService } from '../src/intersect/intersect.service';
import { NearestNeighbourController } from '../src/nearest-neighbour/nearest-neighbour.controller';
import { NearestNeighbourService } from '../src/nearest-neighbour/nearest-neighbour.service';
import { ValuesAtPointController } from '../src/values-at-point/values-at-point.controller';
import { ValuesAtPointService } from '../src/values-at-point/values-at-point.service';
import { WithinController } from '../src/within/within.controller';
import { WithinService } from '../src/within/within.service';
import {
  HEADERS_JSON,
  INTERSECT_URL,
  NEAREST_URL,
  POST,
  URL_START,
  VALUES_AT_POINT_URL,
  WITHIN_URL,
} from './common/constants';
import {
  getGeoJSONFeature,
  getEsriJSONFeature,
} from './common/testDataPreparer';

describe('Geometry type validation (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ValuesAtPointController,
        WithinController,
        IntersectController,
        NearestNeighbourController,
      ],
      imports: [...createE2eTestModules(), GeneralModule, TransformModule],
      providers: [
        ValuesAtPointService,
        WithinService,
        IntersectService,
        NearestNeighbourService,
      ],
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

  const GEOJSON_GEOMETRIES = {
    Point: { type: 'Point' as const, coordinates: [13.75, 51.072] },
    LineString: {
      type: 'LineString' as const,
      coordinates: [
        [13.74, 51.06],
        [13.76, 51.08],
      ],
    },
    Polygon: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [13.74, 51.06],
          [13.76, 51.06],
          [13.76, 51.08],
          [13.74, 51.08],
          [13.74, 51.06],
        ],
      ],
    },
  };

  // UTM 33N, inside the city of Dresden.
  const ESRI_GEOMETRIES = {
    Point: { x: 414000, y: 5654500, spatialReference: { wkid: 25833 } },
    LineString: {
      paths: [
        [
          [412500, 5653000],
          [415500, 5656000],
        ],
      ],
      spatialReference: { wkid: 25833 },
    },
    Polygon: {
      rings: [
        [
          [412500, 5653000],
          [415500, 5653000],
          [415500, 5656000],
          [412500, 5656000],
          [412500, 5653000],
        ],
      ],
      spatialReference: { wkid: 25833 },
    },
  };

  const INPUT_KINDS: InputKind[] = ['GeoJSON', 'EsriJSON'];
  const GEOMETRY_NAMES: GeometryName[] = ['Point', 'LineString', 'Polygon'];
  const GENERAL_ENDPOINTS = [
    ['within', WITHIN_URL],
    ['intersect', INTERSECT_URL],
    ['nearestNeighbour', NEAREST_URL],
  ] as const;

  async function postGeometry(
    url: string,
    kind: InputKind,
    type: GeometryName,
    topic: string,
    nearestNeighbour = false,
  ) {
    const payload =
      kind === 'GeoJSON'
        ? await getGeoJSONFeature({
            topics: [topic],
            returnGeometry: false,
            fixGeometry: GEOJSON_GEOMETRIES[type],
          })
        : getEsriJSONFeature({
            topics: [topic],
            returnGeometry: false,
            outputFormat: 'esrijson',
            fixGeometry: [{ geometry: ESRI_GEOMETRIES[type] }],
          });

    return app.inject({
      method: POST,
      url: URL_START + url,
      payload: nearestNeighbour
        ? { ...payload, count: 1, maxDistanceToNeighbour: 0 }
        : payload,
      headers: HEADERS_JSON,
    });
  }

  describe.each(INPUT_KINDS)('valuesAtPoint with %s input', (kind) => {
    it('accepts a Point', async () => {
      const result = await postGeometry(
        VALUES_AT_POINT_URL,
        kind,
        'Point',
        'hoehe_r',
      );
      expect(result.statusCode).toBe(200);
    });

    it.each(['LineString', 'Polygon'] as const)(
      'rejects a %s with the common error shape',
      async (type) => {
        const result = await postGeometry(
          VALUES_AT_POINT_URL,
          kind,
          type,
          'hoehe_r',
        );
        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.payload)).toEqual({
          statusCode: 400,
          message: 'Invalid user input',
          detailed_errors: [
            `Unsupported geometry type '${type}' for valuesAtPoint. Supported types: Point.`,
          ],
        });
      },
    );
  });

  describe.each(GENERAL_ENDPOINTS)('%s', (endpoint, url) => {
    describe.each(INPUT_KINDS)('with %s input', (kind) => {
      it.each(GEOMETRY_NAMES)('accepts a %s', async (type) => {
        const result = await postGeometry(
          url,
          kind,
          type,
          'kreis_f',
          endpoint === 'nearestNeighbour',
        );
        expect(result.statusCode).toBe(200);
      });
    });
  });

  it('answers with the same error shape as the schema validation', async () => {
    // MultiPolygon is rejected by the schema, not by validateGeometryTypes.
    const schemaPayload = await getGeoJSONFeature({
      topics: ['hoehe_r'],
      returnGeometry: false,
      fixGeometry: { type: 'MultiPolygon', coordinates: [] } as any,
    });
    const schemaError = JSON.parse(
      (
        await app.inject({
          method: POST,
          url: URL_START + VALUES_AT_POINT_URL,
          payload: schemaPayload,
          headers: HEADERS_JSON,
        })
      ).payload,
    );
    const typeError = JSON.parse(
      (await postGeometry(VALUES_AT_POINT_URL, 'GeoJSON', 'Polygon', 'hoehe_r'))
        .payload,
    );

    expect(Object.keys(typeError).sort()).toEqual(
      Object.keys(schemaError).sort(),
    );
    expect(typeError.message).toBe(schemaError.message);
  });
});
