import { BadRequestException } from '@nestjs/common';
import { validateGeometryTypes } from './geometry-type-validation';

describe('validateGeometryTypes', () => {
  it('should only allow Point for valuesAtPoint', () => {
    expect(() =>
      validateGeometryTypes('valuesAtPoint', { type: 'Point' }),
    ).not.toThrow();

    expect(() =>
      validateGeometryTypes('valuesAtPoint', { type: 'LineString' }),
    ).toThrow(BadRequestException);

    expect(() =>
      validateGeometryTypes('valuesAtPoint', { type: 'Polygon' }),
    ).toThrow(BadRequestException);
  });

  it.each(['within', 'intersect', 'nearestNeighbour'])(
    'should allow Point, LineString and Polygon for %s',
    (endpoint) => {
      for (const type of ['Point', 'LineString', 'Polygon']) {
        expect(() => validateGeometryTypes(endpoint, { type })).not.toThrow();
      }
    },
  );

  it.each(['within', 'intersect', 'nearestNeighbour'])(
    'should reject unsupported geometry types for %s',
    (endpoint) => {
      expect(() =>
        validateGeometryTypes(endpoint, { type: 'MultiPolygon' }),
      ).toThrow(BadRequestException);
    },
  );

  it('should include details about unsupported geometry types', () => {
    try {
      validateGeometryTypes('valuesAtPoint', { type: 'Polygon' });
      fail('Expected BadRequestException');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'Unsupported geometry type',
        detailed_errors: [
          "Unsupported geometry type 'Polygon' for valuesAtPoint. Supported types: Point.",
        ],
      });
    }
  });

  it('should throw an Error for an unknown endpoint', () => {
    expect(() =>
      validateGeometryTypes('unknownEndpoint', { type: 'Point' }),
    ).toThrow(
      "No geometry type configuration found for endpoint 'unknownEndpoint'.",
    );
  });
});
