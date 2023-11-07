import { Injectable } from '@nestjs/common';
import { GeoJSON, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LandEntity } from '../general/entities/land.entity';

@Injectable()
export class IntersectService {
  constructor(
    @InjectRepository(LandEntity)
    private landRepository: Repository<LandEntity>,
  ) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateIntersect(): Promise<any[]> {
    const elements = await this.landRepository
      .createQueryBuilder('land')
      .select('ST_AsGeoJSON(l.*)')
      .from(LandEntity, 'l')
      .where('ST_intersects(land.geom, :x::geometry)', {
        x: 'SRID=25833;POINT(377234 5658210)',
      })
      .limit(100) // just for testing
      .getRawMany();
    return elements;
  }
}
