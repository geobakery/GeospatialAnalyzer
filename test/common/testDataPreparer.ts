import { ParameterDto } from '../../src/general/dto/parameter.dto';
import {
  ESRI_JSON_WITHOUT_GEOMETRY_KREIS,
  GEOJSON_WITHOUT_GEOMETRY_KREIS,
  testDataParameterEsriJSONFeature,
  testDataParameterGeoJSONFeature,
} from './constants';

export const getGeoJSONFeature = (
  opts: testDataParameterGeoJSONFeature,
): ParameterDto => {
  const base = { ...GEOJSON_WITHOUT_GEOMETRY_KREIS };
  if (opts.returnGeometry) {
    base.returnGeometry = opts.returnGeometry;
  }
  if (opts.topics) {
    base.topics = opts.topics;
  }
  //FIXME: This modifies the GEOJSON_WITHOUT_GEOMETRY_KREIS' geometries
  if (opts.fixGeometry) {
    base.inputGeometries[0].geometry = { ...opts.fixGeometry };
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
): ParameterDto => {
  const base = { ...ESRI_JSON_WITHOUT_GEOMETRY_KREIS };
  if (opts.returnGeometry) {
    base.returnGeometry = opts.returnGeometry;
  }
  if (opts.topics) {
    base.topics = opts.topics;
  }
  if (opts.fixGeometry) {
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
