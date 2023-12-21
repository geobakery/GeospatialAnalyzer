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
            this.transformCoordinates(
              geo.geometry.coordinates,
              STANDARD_CRS_STRING,
              epsgString,
            );
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
            e.geometry.spatialReference.wkid = args.epsg;
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
            geo.paths | geo.rings | geo.points,
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
