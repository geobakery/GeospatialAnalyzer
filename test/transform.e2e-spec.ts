import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import { TransformModule } from '../src/transform/transform.module';
import { HEADERS_JSON, POST, URL_START } from './common/constants';
import { testStatus200, testStatus400 } from './common/test';

const LON = 13.75;
const LAT = 51.07;

// Closed-form Web Mercator (EPSG:3857), independent of proj4.
const EARTH_RADIUS = 6378137;
const mercatorX = (lon: number) => (lon * Math.PI * EARTH_RADIUS) / 180;
const mercatorY = (lat: number) =>
  EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

const expectClose = (actual: number, expected: number, tolerance: number) => {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
};

const flatten = (c: unknown): number[][] =>
  Array.isArray(c) && typeof c[0] === 'number'
    ? [c as number[]]
    : (c as unknown[]).flatMap(flatten);

const bboxOf = (c: unknown) =>
  flatten(c).reduce(
    (box, [x, y]) => ({
      minX: Math.min(box.minX, x),
      maxX: Math.max(box.maxX, x),
      minY: Math.min(box.minY, y),
      maxY: Math.max(box.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );

const GEOJSON_TO_ESRI = 'transformGeoJSONToEsriJSON';
const ESRI_TO_GEOJSON = 'transformEsriJSONToGeoJSON';

const geoFeature = (geometry: unknown, properties: object = {}) => ({
  type: 'Feature',
  geometry,
  properties,
});

const POINT = { type: 'Point', coordinates: [LON, LAT] };
const LINE = {
  type: 'LineString',
  coordinates: [
    [13.74, 51.06],
    [13.76, 51.08],
  ],
};
const POLYGON = {
  type: 'Polygon',
  coordinates: [
    [
      [13.745, 51.067],
      [13.755, 51.067],
      [13.755, 51.073],
      [13.745, 51.073],
      [13.745, 51.067],
    ],
  ],
};

describe('TransformController (e2e)', () => {
  let app: NestFastifyApplication;

  // URL_START may or may not end with a slash.
  const url = (path: string) =>
    `${URL_START}${URL_START.endsWith('/') ? '' : '/'}${path}`;

  const post = (path: string, payload: Record<string, unknown>) =>
    app.inject({
      method: POST,
      url: url(path),
      payload,
      headers: HEADERS_JSON,
    });

  const toEsri = async (input: unknown[], epsg: number) => {
    const result = await post(GEOJSON_TO_ESRI, { input, epsg });
    await testStatus200(`${GEOJSON_TO_ESRI} ${epsg}`, result);
    return JSON.parse(result.payload) as any[];
  };

  const toGeo = async (input: unknown[]) => {
    const result = await post(ESRI_TO_GEOJSON, { input });
    await testStatus200(ESRI_TO_GEOJSON, result);
    return JSON.parse(result.payload) as any[];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TransformModule],
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

  describe(`POST ${GEOJSON_TO_ESRI}`, () => {
    it('converts a point to plausible UTM 33N values', async () => {
      const [esri] = await toEsri([geoFeature(POINT)], 25833);
      expect(esri.geometry.spatialReference.wkid).toBe(25833);
      expect(esri.geometry.x).toBeGreaterThan(405000);
      expect(esri.geometry.x).toBeLessThan(420000);
      expect(esri.geometry.y).toBeGreaterThan(5650000);
      expect(esri.geometry.y).toBeLessThan(5665000);
    });

    it('matches the closed-form Web Mercator formula', async () => {
      const [esri] = await toEsri([geoFeature(POINT)], 3857);
      expect(esri.geometry.spatialReference.wkid).toBe(3857);
      expectClose(esri.geometry.x, mercatorX(LON), 0.01);
      expectClose(esri.geometry.y, mercatorY(LAT), 0.01);
    });

    it('keeps the coordinates for WGS 84', async () => {
      const [esri] = await toEsri([geoFeature(POINT)], 4326);
      expect(esri.geometry.spatialReference.wkid).toBe(4326);
      expectClose(esri.geometry.x, LON, 1e-9);
      expectClose(esri.geometry.y, LAT, 1e-9);
    });

    it('converts a line string and a polygon', async () => {
      const [line, polygon] = await toEsri(
        [geoFeature(LINE), geoFeature(POLYGON)],
        25833,
      );
      expect(line.geometry.paths).toHaveLength(1);
      expect(line.geometry.paths[0]).toHaveLength(2);
      expect(polygon.geometry.rings).toHaveLength(1);
      expect(polygon.geometry.rings[0]).toHaveLength(5);
    });

    it('keeps order, count and attributes of several features', async () => {
      const result = await toEsri(
        [
          geoFeature(POINT, { name: 'first' }),
          geoFeature(LINE, { name: 'second' }),
          geoFeature(POLYGON, { name: 'third' }),
        ],
        25833,
      );
      expect(result.map((r) => r.attributes.name)).toEqual([
        'first',
        'second',
        'third',
      ]);
    });

    it('answers 400 for an unknown EPSG code', async () => {
      const result = await post(GEOJSON_TO_ESRI, {
        input: [geoFeature(POINT)],
        epsg: 999999,
      });
      expect(result.statusCode).toBe(400);
    });

    it('rejects a request without input with 400', async () => {
      const result = await post(GEOJSON_TO_ESRI, { epsg: 25833 });
      await testStatus400('missing input', result);
    });
  });

  describe(`POST ${ESRI_TO_GEOJSON}`, () => {
    // The Esri requests are built independently from the service under test:
    // the closed-form formula for Web Mercator, the UTM values are checked in
    // the round trip below.
    it('converts a Web Mercator point to WGS 84', async () => {
      const [geo] = await toGeo([
        {
          geometry: {
            x: mercatorX(LON),
            y: mercatorY(LAT),
            spatialReference: { wkid: 3857 },
          },
          attributes: { name: 'p' },
        },
      ]);
      expect(geo.geometry.type).toBe('Point');
      expectClose(geo.geometry.coordinates[0], LON, 1e-7);
      expectClose(geo.geometry.coordinates[1], LAT, 1e-7);
      expect(geo.properties).toMatchObject({ name: 'p' });
    });

    it('answers 400 for an unknown WKID', async () => {
      const result = await post(ESRI_TO_GEOJSON, {
        input: [
          {
            geometry: { x: 1, y: 2, spatialReference: { wkid: 999999 } },
            attributes: {},
          },
        ],
      });
      expect(result.statusCode).toBe(400);
    });

    it('rejects a request without input with 400', async () => {
      const result = await post(ESRI_TO_GEOJSON, {});
      await testStatus400('missing input', result);
    });
  });

  describe('round trip GeoJSON -> EsriJSON -> GeoJSON', () => {
    const cases: [string, unknown][] = [
      ['point', POINT],
      ['line string', LINE],
      ['polygon', POLYGON],
    ];

    describe.each([25833, 25832, 3857])('via wkid %i', (epsg) => {
      it.each(cases)('restores a %s', async (_name, geometry) => {
        const esri = await toEsri([geoFeature(geometry, { name: 'x' })], epsg);
        const [geo] = await toGeo(esri);

        expect((geo.geometry as any).type).toBe((geometry as any).type);
        expect(geo.properties).toMatchObject({ name: 'x' });

        // The ring orientation of polygons may change, so compare the extent.
        const actual = bboxOf(geo.geometry.coordinates);
        const expected = bboxOf((geometry as any).coordinates);
        expectClose(actual.minX, expected.minX, 1e-7);
        expectClose(actual.maxX, expected.maxX, 1e-7);
        expectClose(actual.minY, expected.minY, 1e-7);
        expectClose(actual.maxY, expected.maxY, 1e-7);
      });
    });
  });
});
