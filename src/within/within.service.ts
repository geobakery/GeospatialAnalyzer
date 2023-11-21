import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import { dbRequestBuilderSample } from '../general/general.interface';

const WITHIN_WHERE_CLAUSE = 'ST_Within(:x::geometry, table1.geom)';
const WITHIN_WHERE_CLAUSE_PARAMETER = 'x';
@Injectable()
export class WithinService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateWithin(args: ParameterDto): Promise<GeoJSON[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      where: true,
      whereStatement: WITHIN_WHERE_CLAUSE,
      whereStatementParameter: WITHIN_WHERE_CLAUSE_PARAMETER,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
