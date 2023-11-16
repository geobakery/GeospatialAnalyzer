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
        console.log('polyline', result);
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
            result = result.slice(0, -1);
          }
          result += '),';
        });

        if (result.length) {
          result = result.slice(0, -1);
        }
        return result;
      }
    }
    return '';
  }

  getGeometryTypeGeoJSON(geometry: Geometry): string {
    return geometry.type;
  }
  getPointCoordinatesGeoJSON(geometry: Geometry): string {
    return geometry.type;
  }
}
