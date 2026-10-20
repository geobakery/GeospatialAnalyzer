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
import { getGeoJSONFeature } from './common/testDataPreparer';

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

  const geometries = {
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

  async function postGeometry(
    url: string,
    geometry: (typeof geometries)[keyof typeof geometries],
    topic: string,
    nearestNeighbour = false,
  ) {
    const payload = await getGeoJSONFeature({
      topics: [topic],
      returnGeometry: false,
      fixGeometry: geometry,
    });

    return app.inject({
      method: POST,
      url: URL_START + url,
      payload: nearestNeighbour
        ? {
            ...payload,
            count: 1,
            maxDistanceToNeighbour: 0,
          }
        : payload,
      headers: HEADERS_JSON,
    });
  }

  it.each(['LineString', 'Polygon'] as const)(
    'should reject %s for values-at-point',
    async (type) => {
      const result = await postGeometry(
        VALUES_AT_POINT_URL,
        geometries[type],
        'hoehe_r',
      );

      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.payload);
      expect(body.message).toBe('Unsupported geometry type');
      expect(body.detailed_errors).toContain(
        `Unsupported geometry type '${type}' for valuesAtPoint. Supported types: Point.`,
      );
    },
  );

  it.each(['within', 'intersect', 'nearestNeighbour'] as const)(
    'should accept Point, LineString and Polygon for %s',
    async (endpoint) => {
      const url = {
        within: WITHIN_URL,
        intersect: INTERSECT_URL,
        nearestNeighbour: NEAREST_URL,
      }[endpoint];

      for (const type of ['Point', 'LineString', 'Polygon'] as const) {
        const result = await postGeometry(
          url,
          geometries[type],
          'kreis_f',
          endpoint === 'nearestNeighbour',
        );

        expect(result.statusCode).toBe(200);
      }
    },
  );

  it('should accept Point for values-at-point', async () => {
    const result = await postGeometry(
      VALUES_AT_POINT_URL,
      geometries.Point,
      'hoehe_r',
    );

    expect(result.statusCode).toBe(200);
  });
});
