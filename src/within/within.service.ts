import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType } from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';

const WITHIN_WHERE_CLAUSE = 'WHERE ST_Within(__a__, customFromSelect.geom)';
const WITHIN_FROM = 'FROM (SELECT __b__ FROM __a__ ) AS customFromSelect';
@Injectable()
export class WithinService {
  constructor(private generalService: GeneralService) {}
  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific('within');
  }

  async calculateWithin(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: true,
      whereStatement: WITHIN_WHERE_CLAUSE,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: WITHIN_FROM,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.TABLE],
        ['__b__', ReplaceStringType.ATTRIBUTE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
