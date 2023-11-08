export const TOPICS = ['verw_land_f', 'verw_kreis_f', 'verw_gem_f'];

export enum outputFormatEnum {
  geojson = 'geojson',
  esrijson = 'esrijson',
}
export const geojsonToPostGis = new Map<string, string>([['Point', 'POINT']]);
