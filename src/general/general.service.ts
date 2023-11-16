import {
  DataSource,
  GeoJSON,
  Geometry,
  LineString,
  Point,
  Polygon,
  Repository,
} from 'typeorm';
import { DBResponse } from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { geojsonToPostGis, QUERY_SELECT, topic } from './general.constants';
import { InjectDataSource } from '@nestjs/typeorm';
import { LandEntity } from './entities/land.entity';
import { KreisEntity } from './entities/kreis.entity';

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
}
