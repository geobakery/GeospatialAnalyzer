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
  geometry: { type, coordinates: [] },
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
  ['a bare geometry object', (type) => ({ type, coordinates: [] })],
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

const GENERAL_ENDPOINTS = ['within', 'intersect', 'nearestNeighbour'] as const;
const GEOMETRY_NAMES: GeometryName[] = ['Point', 'LineString', 'Polygon'];

describe('validateGeometryTypes', () => {
  describe.each(INPUT_SHAPES)('with %s', (_shape, build) => {
    it('accepts a Point for valuesAtPoint', () => {
      expect(() =>
        validateGeometryTypes('valuesAtPoint', build('Point')),
      ).not.toThrow();
    });

    it.each(['LineString', 'Polygon'] as const)(
      'rejects a %s for valuesAtPoint',
      (type) => {
        expect(() =>
          validateGeometryTypes('valuesAtPoint', build(type)),
        ).toThrow(BadRequestException);
      },
    );

    describe.each(GENERAL_ENDPOINTS)('for %s', (endpoint) => {
      it.each(GEOMETRY_NAMES)('accepts a %s', (type) => {
        expect(() =>
          validateGeometryTypes(endpoint, build(type)),
        ).not.toThrow();
      });
    });
  });

  describe('error', () => {
    it('has the same shape as the schema validation errors and names the type', () => {
      const error = catchError(() =>
        validateGeometryTypes('valuesAtPoint', [esriFeature('Polygon')]),
      );
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid user input',
        detailed_errors: [
          "Unsupported geometry type 'Polygon' for valuesAtPoint. Supported types: Point.",
        ],
      });
    });

    it('is thrown if only one of several geometries is unsupported', () => {
      expect(() =>
        validateGeometryTypes('valuesAtPoint', [
          geoFeature('Point'),
          geoFeature('Polygon'),
        ]),
      ).toThrow(BadRequestException);
    });

    it('reports every unsupported type once, in order of appearance', () => {
      const error = catchError(() =>
        validateGeometryTypes('valuesAtPoint', [
          geoFeature('Polygon'),
          geoFeature('Point'),
          geoFeature('LineString'),
          geoFeature('Polygon'),
        ]),
      );
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Invalid user input',
        detailed_errors: [
          "Unsupported geometry type 'Polygon' for valuesAtPoint. Supported types: Point.",
          "Unsupported geometry type 'LineString' for valuesAtPoint. Supported types: Point.",
        ],
      });
    });
  });

  // The schema rejects these before the function is reached, but the function
  // must not let them pass if the schema is ever relaxed.
  describe.each(['valuesAtPoint', ...GENERAL_ENDPOINTS] as const)(
    '%s with types outside the schema',
    (endpoint) => {
      it.each([
        'MultiPoint',
        'MultiLineString',
        'MultiPolygon',
        'GeometryCollection',
      ])('reports %s as unsupported', (type) => {
        const error = catchError(() =>
          validateGeometryTypes(endpoint, [geoFeature(type)]),
        );
        expect(error).toBeInstanceOf(BadRequestException);
        expect(
          (error as BadRequestException).getResponse() as {
            detailed_errors: string[];
          },
        ).toMatchObject({
          detailed_errors: [expect.stringContaining(`'${type}'`)],
        });
      });
    },
  );

  // Missing geometries are not this function's business, the services handle them.
  describe('input without a geometry type', () => {
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
      expect(() => validateGeometryTypes('valuesAtPoint', input)).not.toThrow();
    });
  });
});
