import { Injectable } from '@nestjs/common';
import { GeoJSON, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';
import { DBResponse, ErrorResponse } from '../general/general.interface';
import { GeneralService } from '../general/general.service';

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

  async calculateIntersect(): Promise<GeoJSON | ErrorResponse> {
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
        x: 'SRID=25833;POINT(377234 5658210)',
      }) // TODO db specific version
      .limit(100) // just for testing
      .getRawMany()) as DBResponse[];
    return this.generalService.dbToGeoJSON(featureCollection);
  }
}
