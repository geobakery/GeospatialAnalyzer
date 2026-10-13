import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import { createE2eTestModules } from './helpers/database.helper';
import { GeneralModule } from '../src/general/general.module';
import { TransformModule } from '../src/transform/transform.module';
import { WithinController } from '../src/within/within.controller';
import { WithinService } from '../src/within/within.service';
import { IntersectController } from '../src/intersect/intersect.controller';
import { IntersectService } from '../src/intersect/intersect.service';
import { NearestNeighbourController } from '../src/nearest-neighbour/nearest-neighbour.controller';
import { NearestNeighbourService } from '../src/nearest-neighbour/nearest-neighbour.service';
import { getGeoJSONFeatureFromResponse } from './common/test';
import { MAX_BUFFER_DISTANCE } from '../src/general/dto/parameter.dto';
import {
  HEADERS_JSON,
  POST,
  URL_START,
  WITHIN_URL,
  INTERSECT_URL,
  NEAREST_URL,
} from './common/constants';
import { getGeoJSONFeature } from './common/testDataPreparer';

describe('Buffer parameter validation (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        WithinController,
        IntersectController,
        NearestNeighbourController,
      ],
      imports: [...createE2eTestModules(), GeneralModule, TransformModule],
      providers: [WithinService, IntersectService, NearestNeighbourService],
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

  const ENDPOINTS = [
    { name: 'within', url: WITHIN_URL, extraFields: {} },
    { name: 'intersect', url: INTERSECT_URL, extraFields: {} },
  ];

  describe.each(ENDPOINTS)('$name', ({ url, extraFields }) => {
    it('rejects returnBufferGeometry: true without buffer', async () => {
      const payload = {
        ...getGeoJSONFeature({ topics: ['kreis_f'] }),
        ...extraFields,
        returnBufferGeometry: true,
      };
      const result = await app.inject({
        method: POST,
        url: URL_START + url,
        payload,
        headers: HEADERS_JSON,
      });
      expect(result.statusCode).toBe(400);
    });

    it('rejects returnBufferGeometry: true together with buffer: 0', async () => {
      const payload = {
        ...getGeoJSONFeature({ topics: ['kreis_f'] }),
        ...extraFields,
        buffer: 0,
        returnBufferGeometry: true,
      };
      const result = await app.inject({
        method: POST,
        url: URL_START + url,
        payload,
        headers: HEADERS_JSON,
      });
      expect(result.statusCode).toBe(400);
    });

    it('rejects a buffer distance above the configured maximum', async () => {
      const payload = {
        ...getGeoJSONFeature({ topics: ['kreis_f'] }),
        ...extraFields,
        buffer: MAX_BUFFER_DISTANCE + 1,
        returnBufferGeometry: true,
      };
      const result = await app.inject({
        method: POST,
        url: URL_START + url,
        payload,
        headers: HEADERS_JSON,
      });
      expect(result.statusCode).toBe(400);
    });

    it('[KNOWN BEHAVIOR] accepts buffer > 0 without returnBufferGeometry at all', async () => {
      const payload = {
        ...getGeoJSONFeature({ topics: ['kreis_f'] }),
        ...extraFields,
        buffer: 100,
      };
      const result = await app.inject({
        method: POST,
        url: URL_START + url,
        payload,
        headers: HEADERS_JSON,
      });
      expect(result.statusCode).toBe(200);
    });
  });

  it('/POST within: returnBufferGeometry adds exactly one __buffer feature, topic features unchanged', async () => {
    const input = {
      ...(await getGeoJSONFeature({
        topics: ['kreis_f'],
        returnGeometry: false,
        fixGeometry: { type: 'Point', coordinates: [13.75, 51.072] },
      })),
      buffer: 500,
      returnBufferGeometry: true,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + WITHIN_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toBe(200);

    const features = await getGeoJSONFeatureFromResponse(result);

    const bufferFeatures = features.filter(
      (f) => f.properties?.['__buffer'] === true,
    );
    const topicFeatures = features.filter(
      (f) => f.properties?.['__buffer'] !== true,
    );

    expect(bufferFeatures.length).toBe(1);
    const bufferFeature = bufferFeatures[0];
    expect(bufferFeature.properties['__bufferDistance']).toBe(500);
    expect(bufferFeature.properties['__topic']).toBeUndefined();
    expect(bufferFeature.geometry.type).toBe('Polygon');

    expect(topicFeatures.length).toBe(1);
    expect(topicFeatures[0].properties['__topic']).toBe('kreis_f');
  });
  it('/POST intersect: buffer features carry the __geoProperties of their matching input geometry', async () => {
    const payload = {
      topics: ['kreis_f'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [13.04, 51.19] },
          properties: { __geometryIdentifier__: 'my-custom-id', name: 'first' },
        },
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [14.05, 51.12] },
          properties: { name: 'second' },
        },
      ],
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
      buffer: 500,
      returnBufferGeometry: true,
    };

    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toBe(200);

    const features = JSON.parse(result.payload) as any[];
    const bufferFeatures = features.filter(
      (f) => f.properties?.__buffer === true,
    );
    expect(bufferFeatures).toHaveLength(2);

    const firstBuffer = bufferFeatures.find(
      (f) =>
        f.properties.__geoProperties?.__geometryIdentifier__ === 'my-custom-id',
    );
    expect(firstBuffer).toBeDefined();
    expect(firstBuffer.properties.__geoProperties.__geometryIdentifier__).toBe(
      'my-custom-id',
    );
    expect(firstBuffer.properties.__geoProperties.name).toBe('first');
    expect(firstBuffer.properties.__topic).toBeUndefined();

    const secondBuffer = bufferFeatures.find(
      (f) => f.properties.__geoProperties?.name === 'second',
    );
    expect(secondBuffer).toBeDefined();
    expect(secondBuffer.properties.__geoProperties.__geometryIdentifier__).toBe(
      '__ID_1',
    );
  });
  it('nearestNeighbour rejects buffer as an unknown field', async () => {
    const payload = {
      ...getGeoJSONFeature({ topics: ['kreis_f'] }),
      count: 1,
      maxDistanceToNeighbour: 100000,
      buffer: 100,
    };
    const result = await app.inject({
      method: POST,
      url: URL_START + NEAREST_URL,
      payload,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toBe(400);
  });

  it('nearestNeighbour rejects returnBufferGeometry as an unknown field', async () => {
    const payload = {
      ...getGeoJSONFeature({ topics: ['kreis_f'] }),
      count: 1,
      maxDistanceToNeighbour: 100000,
      returnBufferGeometry: true,
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
