import { GeoJSONFeatureDto } from '../../src/general/dto/geo-json.dto';
import { EsriJsonDto } from '../../src/general/dto/esri-json.dto';

export const testStatus200 = async (implName: string, result: any) => {
  console.log(`testStatus200 for ${implName}`);

  expect(result.statusCode).toEqual(200);
  expect(result.statusMessage).toEqual('OK');
};

export const topicTest = async (
  implName: string,
  geojson: GeoJSONFeatureDto,
  topic: string,
) => {
  const props = geojson.properties;
  expect(props['__topic']).toBe(topic);
};

export const payloadDefined = async (result: any) => {
  const data = JSON.parse(result.payload);
  expect(data.length).toBeDefined();
};

export const resultIsGeoJSONFeature = async (result: any) => {
  await payloadDefined(result);
  const data = JSON.parse(result.payload);
  data.forEach((geojson: GeoJSONFeatureDto) => {
    expect(geojson.type === 'Feature').toBeTruthy();
  });
};

export const resultIsGeoJSONFeatureWithGeometry = async (
  result: any,
  geometryType: string,
  exactGeo?: any[],
) => {
  const data = JSON.parse(result.payload);
  const geojson = data[0] as GeoJSONFeatureDto;
  expect(geojson.type).toBe('Feature');

  const geo = geojson.geometry;
  expect(geo.type).toBe(geometryType);
  expect(geo.coordinates).not.toBeNull();
  expect(geo.coordinates.length).toBeGreaterThan(0);
  if (exactGeo) {
    expect(
      JSON.stringify(geo.coordinates) === JSON.stringify(exactGeo),
    ).toBeTruthy();
  }
};

export const resultIsGeoJSONFeatureWithoutGeometry = async (result: any) => {
  await resultIsGeoJSONFeature(result);
  const data = JSON.parse(result.payload);
  data.forEach((geojson: GeoJSONFeatureDto) => {
    const geo = geojson.geometry;
    expect(geo).toBeNull();
  });
};

export const getGeoJSONFeatureFromResponse = async (result: any) => {
  const data = JSON.parse(result.payload);
  return data as GeoJSONFeatureDto[];
};

export const getESRISONFeatureFromResponse = async (result: any) => {
  const data = JSON.parse(result.payload);
  return data as EsriJsonDto[];
};
