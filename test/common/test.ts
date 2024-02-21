import { GeoJSONFeatureDto } from '../../src/general/dto/geo-json.dto';
import { Geometry } from 'typeorm';

export const testStatus200 = async (implName: string, result: any) => {
  console.log(`testStatus200 for ${implName}`);

  expect(result.statusCode).toEqual(200);
  expect(result.statusMessage).toEqual('OK');
};

export const resultProperties = async (
  implName: string,
  geojson: GeoJSONFeatureDto,
  topic: string,
  attributes: Map<string, string | number | boolean>,
) => {
  console.log(`standardProperties for ${implName}`);

  const props = geojson.properties;
  expect(props['__topic'] === topic).toBeTruthy();
  attributes.forEach((value, key) => {
    expect(props[key] === value).toBeTruthy();
  });
};

export const requestParamsPropertiesTest = async (
  implName: string,
  geojson: GeoJSONFeatureDto,
  attributes: Map<string, string | number | boolean>,
) => {
  await requestPropsTest(
    implName,
    geojson,
    attributes,
    'requestParamsPropertiesTest',
    '__requestParams',
  );
};

export const topicTest = async (
  implName: string,
  geojson: GeoJSONFeatureDto,
  topic: string,
) => {
  console.log(`topicTest for ${implName}`);
  const props = geojson.properties;
  console.log(`testing topic value ${topic}`);
  expect(props['__topic'] === topic).toBeTruthy();
};

export const requestGeoPropertiesTest = async (
  implName: string,
  geojson: GeoJSONFeatureDto,
  attributes: Map<string, string | number | boolean>,
) => {
  await requestPropsTest(
    implName,
    geojson,
    attributes,
    'requestGeoPropertiesTest',
    '__geoProperties',
  );
};

async function requestPropsTest(
  implName: string,
  geojson: GeoJSONFeatureDto,
  attributes: Map<string, string | number | boolean>,
  testName: string,
  property: string,
) {
  console.log(`requestParamsProperties for ${implName}`);

  const props = geojson.properties;
  const requestProps = props[property];
  expect(requestProps).toBeDefined();
  attributes.forEach((value, key) => {
    try {
      expect(requestProps[key] === value).toBeTruthy();
    } catch (e) {
      errorMessage(
        testName,
        'For key: ' +
          key +
          ' expected value ' +
          value +
          ' ,but got ' +
          requestProps[key],
        e,
      );
      throw new Error(key + ' ' + value + ' ' + requestProps[key]);
    }
  });
}

export const payloadDefined = async (result: any) => {
  const data = JSON.parse(result.payload);
  expect(data.length).toBeDefined();
};

export const resultIsGeoJSONFeature = async (result: any) => {
  const data = JSON.parse(result.payload);
  const geojson = data[0] as GeoJSONFeatureDto;
  expect(geojson.type === 'Feature').toBeTruthy();
};

export const resultIsGeoJSONFeatureWithGeometry = async (
  result: any,
  geometryType: string,
  exactGeo?: any[],
) => {
  const data = JSON.parse(result.payload);
  const geojson = data[0] as GeoJSONFeatureDto;
  expect(geojson.type === 'Feature').toBeTruthy();

  const geo = geojson.geometry;
  expect(geo.type === geometryType).toBeTruthy();
  expect(geo.coordinates).not.toBeNull();
  expect(geo.coordinates.length > 0).toBeTruthy();
  if (exactGeo) {
    expect(
      JSON.stringify(geo.coordinates) === JSON.stringify(exactGeo),
    ).toBeTruthy();
  }
};

export const resultIsGeoJSONFeatureWithoutGeometry = async (result: any) => {
  await resultIsGeoJSONFeature(result);
  const data = JSON.parse(result.payload);
  const geojson = data[0] as GeoJSONFeatureDto;
  const geo = geojson.geometry;
  expect(geo).toBeNull();
};

function errorMessage(test: string, message: string, e: string) {
  throw new Error(
    'Error in Test ' + test + ' with message: ' + message + ' \n ' + e,
  );
}

export const getGeoJSONFeatureFromResponse = async (result: any) => {
  const data = JSON.parse(result.payload);
  return data[0] as GeoJSONFeatureDto;
};
