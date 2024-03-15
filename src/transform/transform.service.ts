import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { arcgisToGeoJSON, geojsonToArcGIS } from '@terraformer/arcgis';
import proj4 from 'proj4';
import * as epsg from 'proj4-list';
import { EsriGeometryDto } from '../general/dto/esri-geometry.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import {
  GeoJSONFeatureCollectionDto,
  GeoJSONFeatureDto,
} from '../general/dto/geo-json.dto';
import { TransformEsriToGeoDto } from '../general/dto/transform-esri-to-geo.dto';
import { TransformGeoToEsriDto } from '../general/dto/transform-geo-to-esri.dto';
import {
  STANDARD_CRS,
  STANDARD_CRS_STRING,
  STANDARD_EPSG,
} from '../general/general.constants';

@Injectable()
export class TransformService {
  convertGeoJSONToEsriJSON(args: TransformGeoToEsriDto): EsriJsonDto[] {
    const epsgString = STANDARD_EPSG + args.epsg;

    const esriJsonArray = new Array<EsriJsonDto>();

    const geoInput = this.normalizeInputGeometries(args.input);

    for (const geoJSON of geoInput) {
      try {
        if (geoJSON.geometry) {
          this.transformCoordinates(
            geoJSON.geometry.coordinates,
            STANDARD_EPSG + STANDARD_CRS,
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

  /**
   * Registers the given EPSG string for projections in {@link proj4}.
   *
   * @param epsgString
   * @throws HttpException If `epsgString` is invalid or unknown.
   */
  registerCRS(epsgString: string): void {
    try {
      proj4.defs([epsg[epsgString]]);
    } catch (e) {
      throw new HttpException(
        `EPSG code "${epsgString}" is not valid`,
        HttpStatus.BAD_REQUEST,
      );
    }
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
    this.registerCRS(fromEpsgString);
    this.registerCRS(toEpsgString);
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
    this.registerCRS(fromEpsgString);
    this.registerCRS(toEpsgString);
    return proj4(fromEpsgString, toEpsgString, coordinates);
  }

  isGeoJSONFeatureCollectionArray(
    geoArray:
      | EsriJsonDto[]
      | GeoJSONFeatureDto[]
      | GeoJSONFeatureCollectionDto[],
  ): geoArray is GeoJSONFeatureCollectionDto[] {
    return (
      geoArray.length === 0 ||
      geoArray[0] instanceof GeoJSONFeatureCollectionDto
    );
  }

  isEsriJSONArray(
    geoArray:
      | EsriJsonDto[]
      | GeoJSONFeatureDto[]
      | GeoJSONFeatureCollectionDto[],
  ): geoArray is EsriJsonDto[] {
    return geoArray.length === 0 || geoArray[0] instanceof EsriJsonDto;
  }

  public normalizeInputGeometries(
    geometries:
      | EsriJsonDto[]
      | GeoJSONFeatureCollectionDto
      | GeoJSONFeatureCollectionDto[]
      | GeoJSONFeatureDto[],
  ): GeoJSONFeatureDto[] {
    const geometriesArray = Array.isArray(geometries)
      ? geometries
      : [geometries];

    if (this.isEsriJSONArray(geometriesArray)) {
      return this.convertEsriJSONToGeoJSON({ input: geometriesArray });
    }

    if (this.isGeoJSONFeatureCollectionArray(geometriesArray)) {
      return geometriesArray.flatMap(({ features }) => features);
    }

    return geometriesArray;
  }
}
