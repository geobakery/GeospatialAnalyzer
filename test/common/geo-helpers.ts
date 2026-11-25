// A location inside the city of Dresden.
export const LON = 13.75;
export const LAT = 51.07;

// Closed-form Web Mercator (EPSG:3857), independent of proj4.
const EARTH_RADIUS = 6378137;
export const mercatorX = (lon: number) => (lon * Math.PI * EARTH_RADIUS) / 180;
export const mercatorY = (lat: number) =>
  EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

export const expectClose = (
  actual: number,
  expected: number,
  tolerance: number,
) => {
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);
};

export const flatten = (c: unknown): number[][] =>
  Array.isArray(c) && typeof c[0] === 'number'
    ? [c as number[]]
    : (c as unknown[]).flatMap(flatten);

export const bboxOf = (c: unknown) =>
  flatten(c).reduce(
    (box, [x, y]) => ({
      minX: Math.min(box.minX, x),
      maxX: Math.max(box.maxX, x),
      minY: Math.min(box.minY, y),
      maxY: Math.max(box.maxY, y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
