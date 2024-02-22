import {
  ESRI_JSON_WITHOUT_GEOMETRY_KREIS,
  GEOJSON_WITHOUT_GEOMETRY_KREIS,
  testDataParameterEsriJSONFeature,
  testDataParameterGeoJSONFeature,
} from './constants';

export const getGeoJSONFeature = (
  opts: testDataParameterGeoJSONFeature,
  // ): ParameterDto => { // TODO check after Swagger update
): any => {
  console.log(opts);
  const base = { ...GEOJSON_WITHOUT_GEOMETRY_KREIS };
  if (opts.returnGeometry) {
    base.returnGeometry = opts.returnGeometry;
  }
  if (opts.topics) {
    base.topics = opts.topics;
  }
  if (opts.fixGeometry) {
    base.inputGeometries[0].geometry = opts.fixGeometry;
  }
  if (opts.additionalAttributes) {
    opts.additionalAttributes.forEach((value, key) => {
      base[key] = value;
    });
  }
  return base;
};

export const getEsriJSONFeature = (
  opts: testDataParameterEsriJSONFeature,
  // ): ParameterDto => { // TODO check after Swagger update
): any => {
  console.log(opts);
  const base = { ...ESRI_JSON_WITHOUT_GEOMETRY_KREIS };
  if (opts.returnGeometry) {
    base.returnGeometry = opts.returnGeometry;
  }
  if (opts.topics) {
    base.topics = opts.topics;
  }
  if (opts.fixGeometry) {
    // TODO check after swagger update
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    base.inputGeometries = opts.fixGeometry;
  }
  if (opts.outputFormat) {
    base.outputFormat = opts.outputFormat;
  }
  if (opts.additionalAttributes) {
    opts.additionalAttributes.forEach((value, key) => {
      base[key] = value;
    });
  }
  return base;
};
