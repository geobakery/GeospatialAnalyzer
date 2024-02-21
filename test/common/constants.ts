export const GEOJSON_WITHOUT_GEOMETRY_KREIS = {
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
  error: '',
  count: 0,
  returnGeometry: false,
  timeout: 60000,
};

export const GEOJSON_WITH_GEOMETRY_KREIS = {
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
  returnGeometry: true,
  outputFormat: 'geojson',
  timeout: 60000,
};

export const HEADERS_JSON = {
  'content-type': 'application/json; charset=utf-8',
};

export const INTERSECT_URL = 'intersect';
export const POST = 'POST';
export const GET = 'GET';
export const URL_START = '/';
export const TOPIC_URL = '/topics';
