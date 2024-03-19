declare module 'proj4-list' {
  const epsg: Record<string, string[]>;
  export = epsg;
}

// There are definitely-typed typings for @terraformer, but they seem to be incorrect (https://github.com/terraformer-js/terraformer/issues/98)
declare module '@terraformer/arcgis' {
  export function arcgisToGeoJSON(esriJson: unknown): any;
  export function geojsonToArcGIS(geoJson: unknown): any;
}

// There are definitely-typed typings for @terraformer, but they seem to be incorrect (https://github.com/terraformer-js/terraformer/issues/98)
declare module '@terraformer/wkt' {
  export function geojsonToWKT(geoJson: unknown): string;
}
