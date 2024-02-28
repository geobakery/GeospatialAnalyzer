import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import proj4 from 'proj4';
import * as epsg from 'proj4-list';

import { arcgisToGeoJSON, geojsonToArcGIS } from '@terraformer/arcgis';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoGeometryDto } from '../general/dto/geo-geometry.dto';
import {
  GeoJSONFeatureDto,
  GeoJSONFeatureCollectionDto,
} from '../general/dto/geo-json.dto';
import {
  STANDARD_CRS,
  STANDARD_CRS_STRING,
  STANDARD_EPSG,
} from '../general/general.constants';
import { TransformEsriToGeoDto } from '../general/dto/transform-esri-to-geo.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';
import { EsriGeometryDto } from '../general/dto/esri-geometry.dto';

@Injectable()
export class TransformService {
  convertGeoJSONToEsriJSON(args: TransformGeoToEsriDto): EsriJsonDto[] {
    const epsgString = STANDARD_EPSG + args.epsg;
    this.checkCRS(epsgString);

    const esriJsonArray = new Array<EsriJsonDto>();

    let geoInput = Array.isArray(args.input) ? args.input : [args.input];
    if (this.isGeoJSONFeatureCollection(geoInput)) {
      geoInput = geoInput.flatMap(
        (featureCollection) => featureCollection.features,
      );
    } else if (!this.isGeoJSONFeature(geoInput)) {
      throw new HttpException('Malformed GeoJSON', HttpStatus.BAD_REQUEST);
    }

    for (const geoJSON of geoInput) {
      try {
        const geoElement: GeoGeometryDto & {
          crs?: { properties?: { name?: string } };
        } = geoJSON.geometry;
        if (geoElement) {
          const currentCRS = geoElement?.crs?.properties?.name
            ? geoElement?.crs?.properties?.name
            : STANDARD_CRS;
          if (STANDARD_CRS != currentCRS) {
            this.checkCRS(currentCRS);
          }
          this.transformCoordinates(
            geoJSON.geometry.coordinates,
            String(currentCRS),
            epsgString,
          );
        }
      } catch (e) {
        throw new HttpException(
          'Coordinates are not valid',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      try {
        const esriJson: EsriJsonDto = geojsonToArcGIS(geoJSON);
        if (esriJson.geometry?.spatialReference?.wkid) {
          esriJson.geometry.spatialReference.wkid = args.epsg;
        } else {
          // TODO clean code
          if (!esriJson.geometry) {
            esriJson.geometry = {
              spatialReference: {
                wkid: args.epsg,
              },
            } as EsriGeometryDto;
          }
          if (!esriJson.geometry.spatialReference) {
            esriJson.geometry = {
              spatialReference: {
                wkid: args.epsg,
              },
            } as EsriGeometryDto;
          }
        }
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

  transformIncorrectCRSGeoJsonArray(
    array: GeoJSONFeatureDto[],
  ): GeoJSONFeatureDto[] {
    return array.map((geo) => this._transformIncorrectCRSGeoJson(geo));
  }

  _transformIncorrectCRSGeoJson(geo: GeoJSONFeatureDto) {
    return this._transformSingleGeoJsonFeature(geo);
  }

  private _transformSingleGeoJsonFeature(
    geo: GeoJSONFeatureDto,
  ): GeoJSONFeatureDto {
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

  convertEsriJSONToGeoJSON(args: TransformEsriToGeoDto): GeoJSONFeatureDto[] {
    const geoJsonArray = new Array<GeoJSONFeatureDto>();
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
        const geoJson: GeoJSONFeatureDto = arcgisToGeoJSON(esriJSON);
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

  isGeoJSONFeature(geoArray: object[]): geoArray is GeoJSONFeatureDto[] {
    return geoArray.every(
      (geo) =>
        (geo as GeoJSONFeatureDto).type === 'Feature' && 'geometry' in geo,
    );
  }

  isGeoJSONFeatureCollection(
    geoArray: object[],
  ): geoArray is GeoJSONFeatureCollectionDto[] {
    return geoArray.every(
      (geo) =>
        (geo as GeoJSONFeatureCollectionDto).type === 'FeatureCollection',
    );
  }

  returnGeoJSONArrayAsType(geoArray: any[]): GeoJSONFeatureDto[] {
    return this.isGeoJSONFeature(geoArray)
      ? (geoArray as GeoJSONFeatureDto[])
      : null;
  }

  isEsriJSON(geoArray: any[]): geoArray is EsriJsonDto[] {
    return !!geoArray.every((geo) => geo['attributes'] && geo['geometry']);
  }
}
