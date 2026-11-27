import { BadRequestException } from '@nestjs/common';
import { validateGeometryTypes } from './geometry-type-validation';

type GeometryName = 'Point' | 'LineString' | 'Polygon';

const catchError = (fn: () => void): unknown => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
};

const geoFeature = (type: string) => ({
  type: 'Feature',
  geometry: { type, coordinates: [] as unknown[] },
  properties: {},
});
const featureCollection = (features: unknown[]) => ({
  type: 'FeatureCollection',
  features,
});

const ESRI_GEOMETRIES: Record<GeometryName, object> = {
  Point: { x: 1, y: 2, spatialReference: { wkid: 25833 } },
  LineString: {
    paths: [
      [
        [1, 2],
        [3, 4],
      ],
    ],
    spatialReference: { wkid: 25833 },
  },
  Polygon: {
    rings: [
      [
        [1, 2],
        [3, 4],
        [5, 6],
        [1, 2],
      ],
    ],
    spatialReference: { wkid: 25833 },
  },
};
const esriFeature = (type: GeometryName) => ({
  geometry: ESRI_GEOMETRIES[type],
  attributes: {},
});

// Every shape in which the geometries of a request can arrive.
const INPUT_SHAPES: Array<[string, (type: GeometryName) => unknown]> = [
  ['GeoJSON features', (type) => [geoFeature(type)]],
  [
    'a GeoJSON feature collection',
    (type) => featureCollection([geoFeature(type)]),
  ],
  [
    'an array of GeoJSON feature collections',
    (type) => [featureCollection([geoFeature(type)])],
  ],
  ['EsriJSON features', (type) => [esriFeature(type)]],
];

const ENDPOINTS = [
  'valuesAtPoint',
  'within',
  'intersect',
  'nearestNeighbour',
] as const;
const GEOMETRY_NAMES: GeometryName[] = ['Point', 'LineString', 'Polygon'];
const UNSUPPORTED_TYPES = ['MultiPoint', 'MultiLineString', 'MultiPolygon'];

describe('validateGeometryTypes', () => {
  describe.each(INPUT_SHAPES)('with %s', (_shape, build) => {
    describe.each(ENDPOINTS)('for %s', (endpoint) => {
      it.each(GEOMETRY_NAMES)('accepts a %s', (type) => {
        expect(() =>
          validateGeometryTypes(endpoint, build(type)),
        ).not.toThrow();
      });
    });
  });

  describe.each(ENDPOINTS)('%s with types outside the schema', (endpoint) => {
    it.each(UNSUPPORTED_TYPES)('reports %s as unsupported', (type) => {
      const error = catchError(() =>
        validateGeometryTypes(endpoint, [geoFeature(type)]),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid user input',
        detailed_errors: [
          `Unsupported geometry type '${type}' for ${endpoint}. Supported types: Point, LineString, Polygon.`,
        ],
      });
    });
  });

  describe('error', () => {
    it('has the same shape as the schema validation errors and names the type', () => {
      const error = catchError(() =>
        validateGeometryTypes('within', [geoFeature('MultiPolygon')]),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid user input',
        detailed_errors: [
          "Unsupported geometry type 'MultiPolygon' for within. Supported types: Point, LineString, Polygon.",
        ],
      });
    });

    it('is thrown if only one of several geometries is unsupported', () => {
      expect(() =>
        validateGeometryTypes('within', [
          geoFeature('Point'),
          geoFeature('MultiPolygon'),
        ]),
      ).toThrow(BadRequestException);
    });

    it('reports every unsupported type once, in order of appearance', () => {
      const error = catchError(() =>
        validateGeometryTypes('intersect', [
          geoFeature('MultiPoint'),
          geoFeature('Point'),
          geoFeature('GeometryCollection'),
          geoFeature('MultiPoint'),
        ]),
      );
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid user input',
        detailed_errors: [
          "Unsupported geometry type 'MultiPoint' for intersect. Supported types: Point, LineString, Polygon.",
          "Unsupported geometry type 'GeometryCollection' for intersect. Supported types: Point, LineString, Polygon.",
        ],
      });
    });
  });

  // Missing geometries are not this function's business, the services handle them.
  describe.each(ENDPOINTS)(
    '%s with input without a geometry type',
    (endpoint) => {
      it.each([
        ['undefined', undefined],
        ['an empty array', []],
        ['an empty feature collection', featureCollection([])],
        [
          'a feature without geometry',
          [{ type: 'Feature', geometry: null, properties: {} }],
        ],
        ['an EsriJSON feature without geometry', [{ attributes: {} }]],
      ])('is not rejected: %s', (_name, input) => {
        expect(() => validateGeometryTypes(endpoint, input)).not.toThrow();
      });
    },
  );
});
