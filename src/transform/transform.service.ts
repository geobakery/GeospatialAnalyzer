import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { arcgisToGeoJSON, geojsonToArcGIS } from '@terraformer/arcgis';
import proj4 from 'proj4';
import * as epsg from 'proj4-list';
import {
  EsriPointDto,
  EsriPolygonDto,
  EsriPolylineDto,
} from '../general/dto/esri-geometry.dto';
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
        if (typeof esriJson.geometry !== 'undefined')
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

  /**
   * Registers the given EPSG string for projections in {@link proj4}.
   *
   * Supports both legacy (array-based) and modern (string-based) definitions from {@link proj4-list}.
   *
   * @param epsgString
   * @throws HttpException If `epsgString` is invalid or unknown.
   */
  registerCRS(epsgString: string): void {
    const def = epsg[epsgString];

    if (!def) {
      throw new HttpException(
        `EPSG code "${epsgString}" not found`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const projDef = Array.isArray(def) ? def[1] : def;

    if (!projDef || typeof projDef !== 'string') {
      throw new HttpException(
        `Invalid projection definition for ${epsgString}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    proj4.defs(epsgString, projDef);
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
      // Convert the geometry's SRS, because GeoJSON always uses WGS 84
      if (typeof esriJSON.geometry !== 'undefined') {
        try {
          const geo = esriJSON.geometry;
          const epsgString = `${STANDARD_EPSG}${esriJSON.geometry.spatialReference.wkid}`;

          if (geo instanceof EsriPointDto) {
            const convertedCoordinates = this.transformSimpleCoordinates(
              [geo.x, geo.y, geo.z ?? 0, geo.m ?? 0],
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
          } else if (geo instanceof EsriPolylineDto) {
            this.transformCoordinates(
              geo.paths,
              epsgString,
              STANDARD_CRS_STRING,
            );
          } else if (geo instanceof EsriPolygonDto) {
            this.transformCoordinates(
              geo.rings,
              epsgString,
              STANDARD_CRS_STRING,
            );
          }

          // this will remove the "non-standard wkid" warning
          // The coordinates are already transformed at this point
          esriJSON.geometry.spatialReference.wkid = STANDARD_CRS;
          esriJSON.geometry.spatialReference.latestWkid = STANDARD_CRS;
        } catch (e) {
          throw new HttpException(
            'Coordinates are not valid',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      try {
        geoJsonArray.push(arcgisToGeoJSON(esriJSON));
      } catch (e) {
        throw new HttpException(
          'EsriJSON to GeoJSON conversion failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return geoJsonArray;
  }

  /**
   * @TODO: This modifies the given coordinates in place. This makes it easy to
   *        accidentally change the request's original input geometries. We
   *        should create new coordinates instead.
   */
  transformCoordinates(
    coordinates: number[] | number[][] | number[][][],
    fromEpsgString: string,
    toEpsgString: string,
  ) {
    this.registerCRS(fromEpsgString);
    this.registerCRS(toEpsgString);

    function isFlat(c: number[] | number[][] | number[][][]): c is number[] {
      return c.length === 0 || typeof c[0] === 'number';
    }

    if (!isFlat(coordinates)) {
      coordinates.map((coordinate: number[] | number[][]) =>
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

  transformSimpleCoordinates(
    coordinates: [number, number, number, number],
    fromEpsgString: string,
    toEpsgString: string,
  ) {
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
