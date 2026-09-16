export function getBufferQuadSegs(bufferDistance: number): number {
  const maxError = 0.1;
  const minQuadSegs = 8;
  const maxQuadSegs = 256;

  if (bufferDistance <= 0) {
    return minQuadSegs;
  }

  const quadSegs = Math.ceil(
    Math.PI / (4 * Math.acos(1 - maxError / bufferDistance)),
  );

  return Math.min(maxQuadSegs, Math.max(minQuadSegs, quadSegs));
}
