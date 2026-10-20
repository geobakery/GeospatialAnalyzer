import { BadRequestException } from '@nestjs/common';

const supportedTypesByEndpoint: Record<string, string[]> = {
  valuesAtPoint: ['Point'],
  within: ['Point', 'LineString', 'Polygon'],
  intersect: ['Point', 'LineString', 'Polygon'],
  nearestNeighbour: ['Point', 'LineString', 'Polygon'],
};

interface GeometryLike {
  type?: string;
  geometry?: GeometryLike | null;
  features?: GeometryLike[];
  geometries?: GeometryLike[];
  paths?: unknown;
  rings?: unknown;
  x?: number;
  y?: number;
  points?: unknown;
  coordinates?: unknown;
}

function extractGeometryTypes(input: unknown): string[] {
  const geometries = Array.isArray(input) ? input : input ? [input] : [];

  const types: string[] = [];

  for (const item of geometries) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const geometry = item as GeometryLike;

    if (geometry.type === 'Feature') {
      if (geometry.geometry) {
        types.push(...extractGeometryTypes(geometry.geometry));
      }
      continue;
    }

    if (geometry.type === 'FeatureCollection') {
      types.push(...extractGeometryTypes(geometry.features ?? []));
      continue;
    }

    if (geometry.type === 'GeometryCollection') {
      types.push(...extractGeometryTypes(geometry.geometries ?? []));
      continue;
    }

    if (geometry.type) {
      types.push(geometry.type);
      continue;
    }

    // ESRI JSON geometry
    if (geometry.rings !== undefined) {
      types.push('Polygon');
    } else if (geometry.paths !== undefined) {
      types.push('LineString');
    } else if (geometry.points !== undefined) {
      types.push('MultiPoint');
    } else if (geometry.x !== undefined && geometry.y !== undefined) {
      types.push('Point');
    }
  }

  return types;
}

export function validateGeometryTypes(
  endpoint: string,
  inputGeometries: unknown,
): void {
  const supportedTypes = supportedTypesByEndpoint[endpoint];

  if (!supportedTypes) {
    throw new Error(
      `No geometry type configuration found for endpoint '${endpoint}'.`,
    );
  }

  const geometryTypes = extractGeometryTypes(inputGeometries);

  if (geometryTypes.length === 0) {
    return;
  }

  const unsupportedTypes = [
    ...new Set(geometryTypes.filter((type) => !supportedTypes.includes(type))),
  ];

  if (unsupportedTypes.length > 0) {
    throw new BadRequestException({
      statusCode: 400,
      message: 'Unsupported geometry type',
      detailed_errors: unsupportedTypes.map(
        (type) =>
          `Unsupported geometry type '${type}' for ${endpoint}. Supported types: ${supportedTypes.join(', ')}.`,
      ),
    });
  }
}
