import { BadRequestException } from '@nestjs/common';

const supportedTypesByEndpoint = {
  valuesAtPoint: ['Point'],
  within: ['Point', 'LineString', 'Polygon'],
  intersect: ['Point', 'LineString', 'Polygon'],
  nearestNeighbour: ['Point', 'LineString', 'Polygon'],
} satisfies Record<string, string[]>;

export type GeometryValidatedEndpoint = keyof typeof supportedTypesByEndpoint;

interface GeometryLike {
  type?: string;
  geometry?: GeometryLike | null;
  features?: GeometryLike[];
  paths?: unknown;
  rings?: unknown;
  x?: unknown;
  y?: unknown;
}

//Collects the geometry types of the request's input geometries.

function extractGeometryTypes(input: unknown): string[] {
  const items = Array.isArray(input) ? input : input ? [input] : [];
  const types: string[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const geometry = item as GeometryLike;

    if (geometry.type === 'Feature') {
      types.push(...extractGeometryTypes(geometry.geometry));
    } else if (geometry.type === 'FeatureCollection') {
      types.push(...extractGeometryTypes(geometry.features));
    } else if (geometry.type) {
      // GeoJSON geometry
      types.push(geometry.type);
    } else if (geometry.geometry) {
      // EsriJSON feature: the geometry is nested
      types.push(...extractGeometryTypes(geometry.geometry));
    } else if (geometry.rings !== undefined) {
      // EsriJSON geometry, classified by its shape
      types.push('Polygon');
    } else if (geometry.paths !== undefined) {
      types.push('LineString');
    } else if (geometry.x !== undefined && geometry.y !== undefined) {
      types.push('Point');
    }
  }
  return types;
}

export function validateGeometryTypes(
  endpoint: GeometryValidatedEndpoint,
  inputGeometries: unknown,
): void {
  const supportedTypes: string[] = supportedTypesByEndpoint[endpoint];

  const unsupportedTypes = [
    ...new Set(
      extractGeometryTypes(inputGeometries).filter(
        (type) => !supportedTypes.includes(type),
      ),
    ),
  ];

  if (unsupportedTypes.length > 0) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Invalid user input',
      detailed_errors: unsupportedTypes.map(
        (type) =>
          `Unsupported geometry type '${type}' for ${endpoint}. Supported types: ${supportedTypes.join(', ')}.`,
      ),
    });
  }
}
