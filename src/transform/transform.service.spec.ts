import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import proj4 from 'proj4';
import {
  EsriPointDto,
  EsriPolygonDto,
  EsriPolylineDto,
} from '../general/dto/esri-geometry.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import {
  GeoJSONFeatureCollectionDto,
  GeoJSONFeatureDto,
} from '../general/dto/geo-json.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';
import { TransformService } from './transform.service';

// A location inside the city of Dresden.
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

const errorOf = (fn: () => unknown): HttpException => {
  try {
    fn();
  } catch (e) {
    return e as HttpException;
  }
  throw new Error('expected the function to throw');
};

const flatten = (c: unknown): number[][] =>
  Array.isArray(c) && typeof c[0] === 'number'
    ? [c as number[]]
    : (c as unknown[]).flatMap(flatten);

const bboxOf = (c: unknown) => {
  const points = flatten(c);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const feature = (
  geometry: unknown,
  properties: Record<string, unknown> = {},
): GeoJSONFeatureDto =>
  ({ type: 'Feature', geometry, properties }) as GeoJSONFeatureDto;

const collection = (features: GeoJSONFeatureDto[]) =>
  Object.assign(new GeoJSONFeatureCollectionDto(), {
    type: 'FeatureCollection',
    features,
  });

// convertEsriJSONToGeoJSON checks `instanceof`, so real class instances are required.
const esriFeature = (
  geometry: object,
  attributes: Record<string, unknown> = {},
): EsriJsonDto => Object.assign(new EsriJsonDto(), { geometry, attributes });

const esriPoint = (x: number, y: number, wkid: number, attributes = {}) =>
  esriFeature(
    Object.assign(new EsriPointDto(), { x, y, spatialReference: { wkid } }),
    attributes,
  );

const esriPolyline = (paths: number[][][], wkid: number) =>
  esriFeature(
    Object.assign(new EsriPolylineDto(), { paths, spatialReference: { wkid } }),
  );

const esriPolygon = (rings: number[][][], wkid: number) =>
  esriFeature(
    Object.assign(new EsriPolygonDto(), { rings, spatialReference: { wkid } }),
  );

describe('TransformService', () => {
  let service: TransformService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<TransformService>(TransformService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  const project = (lon: number, lat: number, epsg: number) =>
    service.transformSimpleCoordinates(
      [lon, lat, 0, 0],
      'EPSG:4326',
      `EPSG:${epsg}`,
    );

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerCRS', () => {
    it('registers a known EPSG code for proj4', () => {
      service.registerCRS('EPSG:25833');
      expect(proj4.defs('EPSG:25833')).toBeDefined();
    });

    it('rejects an unknown EPSG code with 400', () => {
      const error = errorOf(() => service.registerCRS('EPSG:999999'));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toContain('not found');
    });
  });

  describe('transformSimpleCoordinates', () => {
    it('matches the closed-form Web Mercator formula', () => {
      const [x, y] = project(LON, LAT, 3857);
      expectClose(x, mercatorX(LON), 0.01);
      expectClose(y, mercatorY(LAT), 0.01);
    });

    it('projects to plausible UTM 33N values and round-trips', () => {
      const [x, y] = project(LON, LAT, 25833);
      expect(x).toBeGreaterThan(405000);
      expect(x).toBeLessThan(420000);
      expect(y).toBeGreaterThan(5650000);
      expect(y).toBeLessThan(5665000);

      const [lon, lat] = service.transformSimpleCoordinates(
        [x, y, 0, 0],
        'EPSG:25833',
        'EPSG:4326',
      );
      expectClose(lon, LON, 1e-7);
      expectClose(lat, LAT, 1e-7);
    });
  });

  describe('transformCoordinates', () => {
    const ring = [
      [13.7, 51.0],
      [13.8, 51.0],
      [13.8, 51.1],
      [13.7, 51.0],
    ];

    it('transforms a flat coordinate', () => {
      const [x, y] = service.transformCoordinates(
        [LON, LAT],
        'EPSG:4326',
        'EPSG:3857',
      ) as number[];
      expectClose(x, mercatorX(LON), 0.01);
      expectClose(y, mercatorY(LAT), 0.01);
    });

    it('keeps the nesting of a polygon with a hole', () => {
      const polygon = [ring, ring.map(([x, y]) => [x + 0.01, y + 0.01])];
      const result = service.transformCoordinates(
        structuredClone(polygon),
        'EPSG:4326',
        'EPSG:25833',
      ) as number[][][];
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveLength(4);
      expect(result[1]).toHaveLength(4);
      expect(result[0][0]).toHaveLength(2);
    });

    it('round-trips a ring between WGS 84 and UTM 33N', () => {
      const projected = service.transformCoordinates(
        structuredClone(ring),
        'EPSG:4326',
        'EPSG:25833',
      );
      const back = service.transformCoordinates(
        structuredClone(projected),
        'EPSG:25833',
        'EPSG:4326',
      ) as number[][];
      back.forEach((c, i) => {
        expectClose(c[0], ring[i][0], 1e-7);
        expectClose(c[1], ring[i][1], 1e-7);
      });
    });

    it('rejects an unknown source CRS', () => {
      const error = errorOf(() =>
        service.transformCoordinates([1, 2], 'EPSG:999999', 'EPSG:4326'),
      );
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('convertGeoJSONToEsriJSON', () => {
    // The input is transformed in place, so every call gets a fresh feature.
    const toEsri = (
      geometry: unknown,
      epsg: number,
      properties: Record<string, unknown> = {},
    ) =>
      service.convertGeoJSONToEsriJSON({
        input: [feature(geometry, properties)],
        epsg,
      } as TransformGeoToEsriDto)[0];

    it('converts a point to the requested SRS', () => {
      const esri = toEsri({ type: 'Point', coordinates: [LON, LAT] }, 25833);
      const geo = esri.geometry as any;
      expect(geo.spatialReference.wkid).toBe(25833);
      const [x, y] = project(LON, LAT, 25833);
      expectClose(geo.x, x, 1e-3);
      expectClose(geo.y, y, 1e-3);
    });

    it('matches the closed-form Web Mercator formula', () => {
      const geo = toEsri({ type: 'Point', coordinates: [LON, LAT] }, 3857)
        .geometry as any;
      expect(geo.spatialReference.wkid).toBe(3857);
      expectClose(geo.x, mercatorX(LON), 0.01);
      expectClose(geo.y, mercatorY(LAT), 0.01);
    });

    it('leaves the coordinates unchanged for WGS 84', () => {
      const geo = toEsri({ type: 'Point', coordinates: [LON, LAT] }, 4326)
        .geometry as any;
      expect(geo.spatialReference.wkid).toBe(4326);
      expectClose(geo.x, LON, 1e-9);
      expectClose(geo.y, LAT, 1e-9);
    });

    it('converts a line string to paths', () => {
      const geo = toEsri(
        {
          type: 'LineString',
          coordinates: [
            [13.74, 51.06],
            [13.76, 51.08],
          ],
        },
        25833,
      ).geometry as any;
      expect(geo.paths).toHaveLength(1);
      expect(geo.paths[0]).toHaveLength(2);
      expect(geo.spatialReference.wkid).toBe(25833);
    });

    it('converts a polygon to closed rings', () => {
      const geo = toEsri(
        {
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
        },
        25833,
      ).geometry as any;
      expect(geo.rings).toHaveLength(1);
      expect(geo.rings[0]).toHaveLength(5);
    });

    it('keeps the properties as attributes', () => {
      const esri = toEsri({ type: 'Point', coordinates: [LON, LAT] }, 25833, {
        name: 'test',
      });
      expect(esri.attributes).toMatchObject({ name: 'test' });
    });

    it('sets the geometry of an empty point to null', () => {
      // Raster queries return POINT EMPTY, which is serialised as a point without coordinates.
      const esri = toEsri({ type: 'Point', coordinates: [] }, 25833);
      expect(esri.geometry).toBeNull();
    });

    it('maps an unknown target SRS to a 400 error', () => {
      const error = errorOf(() =>
        toEsri({ type: 'Point', coordinates: [LON, LAT] }, 999999),
      );
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('EPSG code "EPSG:999999" not found');
    });
  });

  describe('convertEsriJSONToGeoJSON', () => {
    const toGeo = (esri: EsriJsonDto) =>
      service.convertEsriJSONToGeoJSON({ input: [esri] })[0];

    it('converts a UTM point to WGS 84', () => {
      const [x, y] = project(LON, LAT, 25833);
      const geo = toGeo(esriPoint(x, y, 25833, { name: 'p' }));
      expect(geo.geometry.type).toBe('Point');
      const [lon, lat] = geo.geometry.coordinates as number[];
      expectClose(lon, LON, 1e-7);
      expectClose(lat, LAT, 1e-7);
      expect(geo.properties).toMatchObject({ name: 'p' });
    });

    it('converts a Web Mercator point using the closed-form formula as input', () => {
      const geo = toGeo(esriPoint(mercatorX(LON), mercatorY(LAT), 3857));
      const [lon, lat] = geo.geometry.coordinates as number[];
      expectClose(lon, LON, 1e-7);
      expectClose(lat, LAT, 1e-7);
    });

    it('converts a polyline to a line string', () => {
      const a = project(13.74, 51.06, 25833);
      const b = project(13.76, 51.08, 25833);
      const geo = toGeo(esriPolyline([[a.slice(0, 2), b.slice(0, 2)]], 25833));
      expect(geo.geometry.type).toBe('LineString');
      const coordinates = geo.geometry.coordinates as number[][];
      expect(coordinates).toHaveLength(2);
      expectClose(coordinates[0][0], 13.74, 1e-7);
      expectClose(coordinates[1][1], 51.08, 1e-7);
    });

    it('converts a polygon and keeps its extent', () => {
      const corners = [
        [13.745, 51.067],
        [13.745, 51.073],
        [13.755, 51.073],
        [13.755, 51.067],
        [13.745, 51.067],
      ].map(([lon, lat]) => project(lon, lat, 25833).slice(0, 2));
      const geo = toGeo(esriPolygon([corners], 25833));
      expect(geo.geometry.type).toBe('Polygon');
      // The ring orientation may change, the extent must not.
      const box = bboxOf(geo.geometry.coordinates);
      expectClose(box.minX, 13.745, 1e-7);
      expectClose(box.maxX, 13.755, 1e-7);
      expectClose(box.minY, 51.067, 1e-7);
      expectClose(box.maxY, 51.073, 1e-7);
    });

    it('rejects an unknown WKID with 400', () => {
      const error = errorOf(() => toGeo(esriPoint(1, 2, 999999)));
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('Coordinates are not valid');
    });
  });

  describe('transformIncorrectCRSGeoJsonArray', () => {
    it('transforms coordinates with a crs member to WGS 84 and removes the member', () => {
      const [x, y] = project(LON, LAT, 25833);
      const [result] = service.transformIncorrectCRSGeoJsonArray([
        feature({
          type: 'Point',
          coordinates: [x, y],
          crs: { type: 'name', properties: { name: 'EPSG:25833' } },
        }),
      ]);
      const geometry = result.geometry as any;
      expectClose(geometry.coordinates[0], LON, 1e-7);
      expectClose(geometry.coordinates[1], LAT, 1e-7);
      expect('crs' in geometry).toBe(false);
    });

    it('leaves a geometry without crs member untouched', () => {
      const [result] = service.transformIncorrectCRSGeoJsonArray([
        feature({ type: 'Point', coordinates: [LON, LAT] }),
      ]);
      expect((result.geometry as any).coordinates).toEqual([LON, LAT]);
    });

    it('removes a crs member without a name and keeps the coordinates', () => {
      const [result] = service.transformIncorrectCRSGeoJsonArray([
        feature({ type: 'Point', coordinates: [LON, LAT], crs: {} }),
      ]);
      const geometry = result.geometry as any;
      expect(geometry.coordinates).toEqual([LON, LAT]);
      expect('crs' in geometry).toBe(false);
    });
  });

  describe('normalizeInputGeometries', () => {
    const a = feature({ type: 'Point', coordinates: [1, 2] });
    const b = feature({ type: 'Point', coordinates: [3, 4] });
    const c = feature({ type: 'Point', coordinates: [5, 6] });

    it('unwraps a single feature collection', () => {
      const result = service.normalizeInputGeometries(collection([a, b]));
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
    });

    it('flattens an array of feature collections', () => {
      const result = service.normalizeInputGeometries([
        collection([a]),
        collection([b, c]),
      ]);
      expect(result).toEqual([a, b, c]);
    });

    it('returns an array of features unchanged', () => {
      expect(service.normalizeInputGeometries([a, b])).toEqual([a, b]);
    });

    it('converts an array of Esri features to GeoJSON features', () => {
      const [x, y] = project(LON, LAT, 25833);
      const result = service.normalizeInputGeometries([esriPoint(x, y, 25833)]);
      expect(result).toHaveLength(1);
      expect(result[0].geometry.type).toBe('Point');
      expectClose((result[0].geometry.coordinates as number[])[0], LON, 1e-7);
    });

    it('returns an empty array for empty input', () => {
      expect(service.normalizeInputGeometries([])).toEqual([]);
    });
  });
});
