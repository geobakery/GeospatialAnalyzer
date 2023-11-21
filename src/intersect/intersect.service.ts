import { Injectable } from '@nestjs/common';
import { GeoJSON } from 'typeorm';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { dbRequestBuilderSample } from '../general/general.interface';

const INTERSECT_WHERE_CLAUSE = 'ST_intersects(table1.geom, :x::geometry)';
const INTERSECT_WHERE_CLAUSE_PARAMETER = 'x';
@Injectable()
export class IntersectService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateIntersect(args: ParameterDto): Promise<GeoJSON[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      where: true,
      whereStatement: INTERSECT_WHERE_CLAUSE,
      whereStatementParameter: INTERSECT_WHERE_CLAUSE_PARAMETER,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
