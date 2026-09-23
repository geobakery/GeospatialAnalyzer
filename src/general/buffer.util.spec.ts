import { getBufferQuadSegs } from './buffer.util';

describe('getBufferQuadSegs', () => {
  it('returns the minimum (8) for buffer distance <= 0', () => {
    expect(getBufferQuadSegs(0)).toBe(8);
    expect(getBufferQuadSegs(-5)).toBe(8);
  });

  it('returns more segments for larger buffer distances (finer approximation needed)', () => {
    const small = getBufferQuadSegs(1);
    const large = getBufferQuadSegs(10000);
    expect(large).toBeGreaterThan(small);
  });

  it('never exceeds the maximum of 256', () => {
    expect(getBufferQuadSegs(20000)).toBeLessThanOrEqual(256);
  });

  it('never falls below the minimum of 8', () => {
    expect(getBufferQuadSegs(0.001)).toBeGreaterThanOrEqual(8);
  });
});
