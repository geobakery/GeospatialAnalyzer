import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import { dbRequestBuilderSample } from '../general/general.interface';
import { ReplaceStringType } from '../general/general.constants';

const WITHIN_WHERE_CLAUSE =
  "WHERE ST_Within('__a'::geometry, customFromSelect.geom)";
const WITHIN_FROM = 'FROM __b customFromSelect';
@Injectable()
export class WithinService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateWithin(args: ParameterDto): Promise<GeoJSON[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: true,
      whereStatement: WITHIN_WHERE_CLAUSE,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__a', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: WITHIN_FROM,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__b', ReplaceStringType.TABLE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
