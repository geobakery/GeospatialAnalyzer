import { DataSource, GeoJSON, Geometry, Point, Repository } from 'typeorm';
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
    if (geo.type === 'Point') {
      const point = geo as Point;
      return '' + point.coordinates[0] + ' ' + point.coordinates[1];
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
