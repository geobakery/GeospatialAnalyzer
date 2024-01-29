import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import proj4 from 'proj4';
import * as epsg from 'proj4-list';

import { arcgisToGeoJSON, geojsonToArcGIS } from '@terraformer/arcgis';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import {
  STANDARD_CRS,
  STANDARD_CRS_STRING,
  STANDARD_EPSG,
} from '../general/general.constants';
import { TransformEsriToGeoDto } from '../general/dto/transform-esri-to-geo.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';
import { EsriGeometry } from '../general/general.interface';
import { EsriGeometryDto } from '../general/dto/esri-geometry.dto';

@Injectable()
export class TransformService {
  convertGeoJSONToEsriJSON(args: TransformGeoToEsriDto): EsriJsonDto[] {
    const epsgString = STANDARD_EPSG + args.epsg;
    this.checkCRS(epsgString);

    const esriJsonArray = new Array<EsriJsonDto>();
    for (const geoJSON of args.input) {
      if (geoJSON.features && geoJSON.features.length) {
        geoJSON.features.forEach((geo) => {
          try {
            const geoElement = geo.geometry as any;
            if (geoElement) {
              const currentCRS = geoElement?.crs?.properties?.name
                ? geoElement?.crs?.properties?.name
                : STANDARD_CRS;
              if (STANDARD_CRS != currentCRS) {
                this.checkCRS(currentCRS);
              }
              this.transformCoordinates(
                geo.geometry.coordinates,
                currentCRS,
                epsgString,
              );
            }
          } catch (e) {
            throw new HttpException(
              'Coordinates are not valid',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        });
      } else {
        try {
          this.transformCoordinates(
            geoJSON.geometry.coordinates,
            STANDARD_CRS_STRING,
            epsgString,
          );
        } catch (e) {
          throw new HttpException(
            'Coordinates are not valid',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      // TODO geojsonToArcGIS accepts feature collections: remove from for loop
      try {
        const esriJson: EsriJsonDto[] = geojsonToArcGIS(geoJSON);
        if (esriJson.length) {
          esriJson.forEach((e) => {
            if (e.geometry?.spatialReference?.wkid) {
              e.geometry.spatialReference.wkid = args.epsg;
            } else {
              // TODO clean code
              if (!e.geometry) {
                e.geometry = {
                  spatialReference: {
                    wkid: args.epsg,
                  },
                } as EsriGeometryDto;
              }
              if (!e.geometry.spatialReference) {
                e.geometry = {
                  spatialReference: {
                    wkid: args.epsg,
                  },
                } as EsriGeometryDto;
              }
            }
            esriJsonArray.push(e);
          });
        }
      } catch (e) {
        throw new HttpException(
          'GeoJSON to EsriJSON conversion failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return esriJsonArray;
  }

  checkCRS(epsgString: string): boolean {
    try {
      proj4.defs([epsg[epsgString]]);
    } catch (e) {
      throw new HttpException(
        'EPSG code is not valid',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return true;
  }

  transformIncorrectCRSGeoJsonArray(array: GeoJsonDto[]): GeoJsonDto[] {
    return array.map((geo) => this._transformIncorrectCRSGeoJson(geo));
  }
  _transformIncorrectCRSGeoJson(geo: GeoJsonDto) {
    if (geo.features) {
      geo.features = geo.features.map((feature) =>
        this._transformSingleGeoJsonFeature(feature),
      );
      return geo;
    } else {
      return this._transformSingleGeoJsonFeature(geo);
    }
  }

  private _transformSingleGeoJsonFeature(geo: GeoJsonDto): GeoJsonDto {
    const geometry = geo.geometry as any;
    if (geometry?.crs) {
      const crs = geometry.crs.properties?.name;
      if (crs) {
        try {
          this.checkCRS(crs);

          this.transformCoordinates(
            geo.geometry.coordinates,
            crs,
            STANDARD_CRS_STRING,
          );
        } catch (e) {
          throw new HttpException(
            'Coordinates are not valid',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
      delete geometry.crs;
    }
    return geo;
  }

  convertEsriJSONToGeoJSON(args: TransformEsriToGeoDto): GeoJsonDto[] {
    const geoJsonArray = new Array<GeoJsonDto>();
    for (const esriJSON of args.input) {
      const epsgString =
        STANDARD_EPSG + esriJSON.geometry.spatialReference.wkid;
      this.checkCRS(epsgString);

      try {
        const geo = esriJSON.geometry;
        if (geo.x && geo.y) {
          const convertedCoordinates = this.transformSimpleCoordinates(
            [geo.x, geo.y, geo.z | 0, geo.m | 0],
            epsgString,
            STANDARD_CRS_STRING,
          );

          geo.x = convertedCoordinates[0];
          geo.y = convertedCoordinates[1];

          if (geo.z) {
            geo.z = convertedCoordinates[2];
          }
          if (geo.m) {
            geo.m = convertedCoordinates[3];
          }
        } else if (geo.paths || geo.rings || geo.points) {
          this.transformCoordinates(
            geo.paths ? geo.paths : geo.rings ? geo.rings : geo.points,
            epsgString,
            STANDARD_CRS_STRING,
          );
        }
      } catch (e) {
        throw new HttpException(
          'Coordinates are not valid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        // this will remove the "non standard wkid" warning
        // The coordinates are already transformed at this point
        if (esriJSON?.geometry?.spatialReference?.wkid) {
          esriJSON.geometry.spatialReference.wkid = STANDARD_CRS;
        }
        const geoJson: GeoJsonDto = arcgisToGeoJSON(esriJSON);
        geoJsonArray.push(geoJson);
      } catch (e) {
        throw new HttpException(
          'EsriJSON to GeoJSON conversion failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return geoJsonArray;
  }

  transformCoordinates(
    coordinates: any,
    fromEpsgString: string,
    toEpsgString: string,
  ) {
    if (Array.isArray(coordinates[0])) {
      coordinates.map((coordinate) =>
        this.transformCoordinates(coordinate, fromEpsgString, toEpsgString),
      );
    } else {
      const transformedCoordinates = proj4(
        fromEpsgString,
        toEpsgString,
        coordinates,
      );
      coordinates.splice(0);
      coordinates.push(...transformedCoordinates);
    }
    return coordinates;
  }

  transformSimpleCoordinates(coordinates, fromEpsgString, toEpsgString) {
    return proj4(fromEpsgString, toEpsgString, coordinates);
  }

  isGeoJSON(geoArray: any[]): boolean {
    return !!geoArray.every(
      (geo) => geo['type'] && (geo['geometry'] || geo['features']),
    );
  }
  returnGeoJSONArrayAsType(geoArray: any[]): GeoJsonDto[] {
    return this.isGeoJSON(geoArray) ? (geoArray as GeoJsonDto[]) : null;
  }
  isEsriJSON(geoArray: any[]): boolean {
    return !!geoArray.every((geo) => geo['attributes'] && geo['geometry']);
  }
}
