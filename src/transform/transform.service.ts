import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import proj4 from 'proj4';
import * as epsg from 'proj4-list';

import { arcgisToGeoJSON, geojsonToArcGIS } from '@terraformer/arcgis';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { GeoJSON } from 'typeorm';
import {
  STANDARD_CRS,
  STANDARD_CRS_STRING,
  STANDARD_EPSG,
} from '../general/general.constants';

@Injectable()
export class TransformService {
  convertGeoJSONToEsriJSON(args): EsriJsonDto[] {
    const epsgString = 'EPSG:' + args.epsg;
    try {
      proj4.defs([epsg[epsgString]]);
    } catch (e) {
      throw new HttpException(
        'EPSG code is not valid',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const esriJsonArray = new Array<EsriJsonDto>();

    for (const geoJSON of args.geoJsonArray) {
      try {
        this.transformCoordinates(
          geoJSON.geometry.coordinates,
          'EPSG:4326',
          epsgString,
        );
      } catch (e) {
        throw new HttpException(
          'Coordinates are not valid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        const esriJson: EsriJsonDto = geojsonToArcGIS(geoJSON);
        esriJson.geometry.spatialReference.wkid = args.epsg;
        esriJsonArray.push(esriJson);
      } catch (e) {
        throw new HttpException(
          'GeoJSON to EsriJSON conversion failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return esriJsonArray;
  }

  convertEsriJSONToGeoJSON(args): GeoJsonDto[] {
    const geoJsonArray = new Array<GeoJsonDto>();

    for (const esriJSON of args.esriJsonArray) {
      const epsgString =
        STANDARD_EPSG + esriJSON.geometry.spatialReference.wkid;
      try {
        proj4.defs([epsg[epsgString]]);
      } catch (e) {
        throw new HttpException(
          'EPSG code is not valid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        if (esriJSON.geometry.x && esriJSON.geometry.y) {
          const simpleCoordinates = [esriJSON.geometry.x, esriJSON.geometry.y];

          if (esriJSON.geometry.z) {
            simpleCoordinates.push(esriJSON.geometry.z);
          } else {
            simpleCoordinates.push(0);
          }

          if (esriJSON.geometry.m) {
            simpleCoordinates.push(esriJSON.geometry.m);
          } else {
            simpleCoordinates.push(0);
          }

          const convertedCoordinates = this.transformSimpleCoordinates(
            simpleCoordinates,
            epsgString,
            STANDARD_CRS_STRING,
          );

          esriJSON.geometry.x = convertedCoordinates[0];
          esriJSON.geometry.y = convertedCoordinates[1];

          if (esriJSON.geometry.z) {
            esriJSON.geometry.z = convertedCoordinates[2];
          }

          if (esriJSON.geometry.m) {
            esriJSON.geometry.m = convertedCoordinates[3];
          }
        }
        if (esriJSON.geometry.paths) {
          this.transformCoordinates(
            esriJSON.geometry.paths,
            epsgString,
            STANDARD_CRS_STRING,
          );
        }
        if (esriJSON.geometry.rings) {
          this.transformCoordinates(
            esriJSON.geometry.rings,
            epsgString,
            STANDARD_CRS_STRING,
          );
        }
        if (esriJSON.geometry.points) {
          this.transformCoordinates(
            esriJSON.geometry.points,
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

  transformCoordinates(coordinates, fromEpsgString, toEpsgString) {
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
    return !!geoArray.every((geo) => geo['type'] && geo['geometry']);
  }
  isEsriJSON(geoArray: any[]): boolean {
    return !!geoArray.every((geo) => geo['attributes'] && geo['geometry']);
  }
}
