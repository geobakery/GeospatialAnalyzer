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
import { ValuesAtGridController } from '../src/values-at-grid/values-at-grid.controller';
import { ValuesAtGridService } from '../src/values-at-grid/values-at-grid.service';
import { WithinController } from '../src/within/within.controller';
import { WithinService } from '../src/within/within.service';
import {
  HEADERS_JSON,
  INTERSECT_URL,
  NEAREST_URL,
  POST,
  URL_START,
  VALUES_AT_GRID_URL,
  WITHIN_URL,
} from './common/constants';
import {
  getGeoJSONFeature,
  getEsriJSONFeature,
} from './common/testDataPreparer';
import {
  GeoJSONLineString,
  GeoJSONPoint,
  GeoJSONPolygon,
} from '../src/general/dto/geo-geometry.dto';
import { EsriJsonDto } from '../src/general/dto/esri-json.dto';

type InputKind = 'GeoJSON' | 'EsriJSON';
type GeometryName = 'Point' | 'LineString' | 'Polygon';

describe('Geometry type validation (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ValuesAtGridController,
        WithinController,
        IntersectController,
        NearestNeighbourController,
      ],
      imports: [...createE2eTestModules(), GeneralModule, TransformModule],
      providers: [
        ValuesAtGridService,
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

  const GEOJSON_GEOMETRIES: {
    Point: GeoJSONPoint;
    LineString: GeoJSONLineString;
    Polygon: GeoJSONPolygon;
  } = {
    Point: { type: 'Point', coordinates: [13.75, 51.072] },
    LineString: {
      type: 'LineString',
      coordinates: [
        [13.75, 51.072],
        [13.750129, 51.072108],
      ],
    },
    Polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [13.7495, 51.0717],
          [13.7505, 51.0717],
          [13.7505, 51.0723],
          [13.7495, 51.0723],
          [13.7495, 51.0717],
        ],
      ],
    },
  };

  // UTM 33N, around the same spot, 100 m edge length.
  const ESRI_GEOMETRIES: Record<
    GeometryName,
    NonNullable<EsriJsonDto['geometry']>
  > = {
    Point: { x: 414000, y: 5654500, spatialReference: { wkid: 25833 } },
    LineString: {
      paths: [
        [
          [412425, 5658575],
          [412434, 5658587],
        ],
      ],
      spatialReference: { wkid: 25833 },
    },
    Polygon: {
      rings: [
        [
          [413950, 5654450],
          [414050, 5654450],
          [414050, 5654550],
          [413950, 5654550],
          [413950, 5654450],
        ],
      ],
      spatialReference: { wkid: 25833 },
    },
  };

  const INPUT_KINDS: InputKind[] = ['GeoJSON', 'EsriJSON'];
  const GEOMETRY_NAMES: GeometryName[] = ['Point', 'LineString', 'Polygon'];
  // [endpoint, url, topic]
  const ENDPOINTS = [
    ['valuesAtGrid', VALUES_AT_GRID_URL, 'hoehe_r'],
    ['within', WITHIN_URL, 'kreis_f'],
    ['intersect', INTERSECT_URL, 'kreis_f'],
    ['nearestNeighbour', NEAREST_URL, 'kreis_f'],
  ] as const;

  async function postGeometry(
    url: string,
    kind: InputKind,
    geometry: GeometryName,
    topic: string,
    nearestNeighbour = false,
  ) {
    const payload =
      kind === 'GeoJSON'
        ? await getGeoJSONFeature({
            topics: [topic],
            returnGeometry: false,
            fixGeometry: GEOJSON_GEOMETRIES[geometry],
          })
        : getEsriJSONFeature({
            topics: [topic],
            returnGeometry: false,
            outputFormat: 'esrijson',
            fixGeometry: [{ geometry: ESRI_GEOMETRIES[geometry] }],
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

  describe.each(ENDPOINTS)('%s', (endpoint, url, topic) => {
    describe.each(INPUT_KINDS)('with %s input', (kind) => {
      it.each(GEOMETRY_NAMES)('accepts a %s', async (type) => {
        const result = await postGeometry(
          url,
          kind,
          type,
          topic,
          endpoint === 'nearestNeighbour',
        );
        expect(result.statusCode).toBe(200);
      });
    });

    // The schema rejects geometry types outside Point/LineString/Polygon
    // before validateGeometryTypes is reached.
    it('rejects a MultiPolygon with the common error shape', async () => {
      const payload = await getGeoJSONFeature({
        topics: [topic],
        returnGeometry: false,
        fixGeometry: { type: 'MultiPolygon', coordinates: [] } as any,
      });
      const result = await app.inject({
        method: POST,
        url: URL_START + url,
        payload,
        headers: HEADERS_JSON,
      });

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.payload)).toMatchObject({
        statusCode: 400,
        message: 'Invalid user input',
      });
    });
  });
});
