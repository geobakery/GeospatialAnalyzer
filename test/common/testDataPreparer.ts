import { EsriJsonDto } from '../../src/general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../../src/general/dto/geo-json.dto';
import { ParameterDto } from '../../src/general/dto/parameter.dto';
import {
  ESRI_JSON_WITHOUT_GEOMETRY_KREIS,
  GEOJSON_WITHOUT_GEOMETRY_KREIS,
  testDataParameterEsriJSONFeature,
  testDataParameterGeoJSONFeature,
} from './constants';

export const getGeoJSONFeature = (
  opts: testDataParameterGeoJSONFeature,
): ParameterDto & { inputGeometries: GeoJSONFeatureDto[] } => {
  const base = GEOJSON_WITHOUT_GEOMETRY_KREIS();
  if (opts.returnGeometry) {
    base.returnGeometry = opts.returnGeometry;
  }
  if (opts.topics) {
    base.topics = opts.topics;
  }
  if (opts.fixGeometry) {
    base.inputGeometries[0].geometry = { ...opts.fixGeometry };
  }
  return base;
};

export const getEsriJSONFeature = (
  opts: testDataParameterEsriJSONFeature,
): ParameterDto & { inputGeometries: EsriJsonDto[] } => {
  const base = ESRI_JSON_WITHOUT_GEOMETRY_KREIS();
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
  if (opts.outSRS) {
    base.outSRS = opts.outSRS;
  }
  return base;
};
