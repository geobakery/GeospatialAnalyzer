import { Injectable } from '@nestjs/common';
import { GeoJSON } from 'typeorm';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { dbRequestBuilderSample } from '../general/general.interface';
import { ReplaceStringType } from '../general/general.constants';

const INTERSECT_WHERE_CLAUSE =
  "WHERE ST_intersects(customFromSelect.geom, '__b'::geometry)";
const INTERSECT_FROM = 'FROM __a customFromSelect';
@Injectable()
export class IntersectService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return ['testTopic'];
  }

  async calculateIntersect(args: ParameterDto): Promise<GeoJSON[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: true,
      whereStatement: INTERSECT_WHERE_CLAUSE,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__b', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: INTERSECT_FROM,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a', ReplaceStringType.TABLE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
