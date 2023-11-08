import { Injectable } from '@nestjs/common';
import { GeoJSON, Geometry, Point, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';
import { DBResponse, ErrorResponse } from '../general/general.interface';
import { GeneralService } from '../general/general.service';
import { geojsonToPostGis } from '../general/general.constants';
import { ParameterDto } from '../general/dto/parameter.dto';

@Injectable()
export class IntersectService {
  constructor(
    @InjectRepository(LandEntity)
    private landRepository: Repository<LandEntity>,
    private generalService: GeneralService,
  ) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJSON | ErrorResponse> {
    const geoInput = args.inputGeometries as GeoJSON[];
    let geo: GeoJSON;
    if (Array.isArray(geoInput)) {
      geo = geoInput[0];
    }
    if (geo.type !== 'Feature') {
      return undefined;
    }
    const featureCollection = (await this.landRepository
      .createQueryBuilder('land') //TODO topic specifc call
      .select(
        'json_build_object(\n' +
          "    'type', 'FeatureCollection',\n" +
          "    'features', json_agg(ST_AsGeoJSON(l.*)::json)\n" +
          '  ) as response',
      ) // TODO db specific version
      .from(LandEntity, 'l')
      .where('ST_intersects(land.geom, :x::geometry)', {
        x: this._buildGeometry(geo.geometry),
      }) // TODO db specific version
      .limit(100) // just for testing
      .getRawMany()) as DBResponse[];

    //x: 'SRID=25833;POINT(377234 5658210)'

    return this.generalService.dbToGeoJSON(featureCollection);
  }

  _buildGeometry(geo: Geometry): string {
    let result = 'SRID=25833;';
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
}
