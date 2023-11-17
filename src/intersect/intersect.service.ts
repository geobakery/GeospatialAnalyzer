import { Injectable } from '@nestjs/common';
import { GeoJSON } from 'typeorm';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';

const INTERSECT_WHERE_CLAUSE = 'ST_intersects(table1.geom, :x::geometry)';
const INTERSECT_WHERE_CLAUSE_PARAMETER = 'x';
@Injectable()
export class IntersectService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateIntersect(args: ParameterDto): Promise<GeoJSON[]> {
    return this.generalService.calculateMethode(
      args,
      INTERSECT_WHERE_CLAUSE,
      INTERSECT_WHERE_CLAUSE_PARAMETER,
    );
  }
}
