import { GeoGeometryDto } from '../../src/general/dto/geo-geometry.dto';
import { EsriJsonDto } from '../../src/general/dto/esri-json.dto';
import { ParameterDto } from '../../src/general/dto/parameter.dto';

export const GEOJSON_WITHOUT_GEOMETRY_KREIS: ParameterDto = {
  inputGeometries: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [13.75, 51.07],
      },
      properties: {
        name: 'testname',
        test: 9,
      },
    },
  ],
  topics: ['verw_kreis_f'],
  count: 0,
  returnGeometry: false,
  timeout: 60000,
  outputFormat: 'geojson',
  maxDistanceToNeighbour: 0,
  outSRS: 4326,
};
export const ESRI_JSON_WITHOUT_GEOMETRY_KREIS: ParameterDto = {
  inputGeometries: [
    {
      geometry: {
        x: 413093.3077572279,
        y: 5659110.3644715585,
        spatialReference: {
          wkid: 25833,
        },
      },
      attributes: {
        name: 'testname',
        test: 9,
      },
    },
  ],
  topics: ['verw_kreis_f'],
  returnGeometry: false,
  outputFormat: 'esrijson',
  outSRS: 25833,
  maxDistanceToNeighbour: 0,
  timeout: 60000,
  count: 0,
};

export const HEADERS_JSON = {
  'content-type': 'application/json; charset=utf-8',
};

export const INTERSECT_URL = 'intersect';
export const NEAREST_URL = 'nearestNeighbour';
export const WITHIN_URL = 'within';
export const VALUES_AT_POINT_URL = 'valuesAtPoint';
export const POST = 'POST';
export const GET = 'GET';
export const URL_START = '/';
export const TOPIC_URL = '/topics';

export const INTERSECT: string = 'Intersect';
export const WITHIN: string = 'Within';
export const VAlUES_AT_POINT: string = 'Values-at-point';
export const NEAREST_NEIGHBOUR: string = 'Nearest-Neighbour';

//
export interface testDataParameterGeoJSONFeature {
  returnGeometry?: boolean;
  geometryType?: string;
  fixGeometry?: GeoGeometryDto;
  topics?: string[];
  additionalAttributes?: Map<string, any>;
  outputFormat?: string;
  count?: number;
}

export interface testDataParameterEsriJSONFeature {
  returnGeometry?: boolean;
  geometryType?: string;
  fixGeometry?: EsriJsonDto[];
  outputFormat?: string;
  topics?: string[];
  additionalAttributes?: Map<string, any>;
  count?: number;
}
