import {
  DataSource,
  GeoJSON,
  Geometry,
  LineString,
  Point,
  Polygon,
  Repository,
} from 'typeorm';
import { CrsGeometry, DBResponse } from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  EPSG_REGEX,
  GEO_IDENTIFIER,
  geojsonToPostGis,
  QUERY_SELECT,
  REQUESTPARAMS,
  STANDARD_CRS,
  topic,
} from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { LandEntity } from './entities/land.entity';
import { KreisEntity } from './entities/kreis.entity';
import { ParameterDto } from './dto/parameter.dto';

@Injectable()
export class GeneralService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  getRepository(top: topic): Repository<any> {
    let entity;
    switch (top) {
      case topic.land: {
        entity = LandEntity;
        break;
      }
      case topic.kreis: {
        entity = KreisEntity;
        break;
      }
    }
    return this.dataSource.getRepository(entity);
  }

  dbToGeoJSON(response: DBResponse[]): GeoJSON[] {
    if (response.length) {
      return response.map((r) => r.response);
    } else {
      throw new HttpException(
        'Unexpected formate error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getDBSpecificSelect(): string {
    // TODO other DB's
    return QUERY_SELECT;
  }

  _buildGeometry(geo: Geometry, crs: number): string {
    let result = 'SRID=' + crs + ';';
    const geoType = geojsonToPostGis.get(geo.type);
    result += geoType;
    const coordinates = this._buildCoordinatesFromDBType(geo);
    result += '(' + coordinates + ')';
    return result;
  }
  _buildCoordinatesFromDBType(geo: Geometry): string {
    switch (geo.type) {
      case 'Point': {
        const point = geo as Point;
        return '' + point.coordinates[0] + ' ' + point.coordinates[1];
      }
      case 'GeometryCollection':
      case 'MultiPolygon':
      case 'MultiLineString':
      case 'MultiPoint': {
        //TODO
        // Example GEOMETRYCOLLECTION(POINT(2 0),POLYGON((0 0, 1 0, 1 1, 0 1, 0 0)))');
        switch (geo.type) {
          case 'MultiLineString': {
            break;
          }
          case 'MultiPoint': {
            break;
          }
          case 'GeometryCollection': {
            break;
          }
          case 'MultiPolygon': {
            break;
          }
        }
        return '';
      }
      case 'LineString': {
        const line = geo as LineString;
        let result: string = '';
        line.coordinates.forEach((c) => {
          result += '' + c.join(' ') + ',';
        });
        if (result.length) {
          result = result.slice(0, -1);
        }
        return result;
      }
      case 'Polygon': {
        const polygon = geo as Polygon;
        let result: string = '';
        polygon.coordinates.forEach((c) => {
          result += '(';
          c.forEach((c2) => {
            result += '' + c2.join(' ') + ',';
          });
          if (result.length) {
            // remove last comma for segment
            result = result.slice(0, -1);
          }
          result += '),';
        });

        if (result.length) {
          // remove last comma for polygon
          result = result.slice(0, -1);
        }
        return result;
      }
    }
    return '';
  }

  getCoordinateSystem(geo: any): number {
    if (geo?.crs) {
      const name = geo.crs.properties?.name;
      if (name) {
        const match = name.match(EPSG_REGEX);
        if (match.length === 1) {
          return Number(match[0]);
        }
      }
    }
    return STANDARD_CRS;
  }

  getGeometryIdentifier(geo: GeoJSON): string {
    if (geo.type === 'Feature') {
      return geo.properties[GEO_IDENTIFIER];
    }
    return undefined;
  }

  getAndSetGeoID(geo: GeoJSON, index: number): string {
    const id = this.getGeometryIdentifier(geo);
    if (!id) {
      return '__ID:' + index;
    }
    return id;
  }
  addGeoIdentifier(
    geoArray: GeoJSON[],
    inputGeo: GeoJSON,
    index: number,
    requestParams: any,
  ): void {
    if (!geoArray.length) {
      return;
    }
    const id = this.getAndSetGeoID(inputGeo, index);
    geoArray.forEach((geo) => {
      if (geo.type === 'FeatureCollection') {
        const features = geo.features;
        features.forEach((feature) => {
          feature.properties[GEO_IDENTIFIER] = id;
          feature.properties[REQUESTPARAMS] = requestParams;
        });
      } else if (geo.type === 'Feature') {
        geo.properties[GEO_IDENTIFIER] = id;
        geo.properties[REQUESTPARAMS] = requestParams;
      }
    });
  }

  setRequestParameterForResponse(args: ParameterDto): any {
    return {
      topics: args.topics,
      outputFormat: args.outputFormat,
      returnGeometry: args.returnGeometry,
    };
  }
}
