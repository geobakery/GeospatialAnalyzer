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

const INTERSECT_WHERE_CLAUSE =
  'WHERE ST_intersects(customFromSelect.geom, __c__)';
const INTERSECT_FROM = 'FROM (SELECT __b__ FROM __a__ ) AS customFromSelect';

@Injectable()
export class IntersectService {
  constructor(private generalService: GeneralService) {}
  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'intersect',
    );
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: true,
      whereStatement: INTERSECT_WHERE_CLAUSE,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__c__', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: INTERSECT_FROM,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.TABLE],
        ['__b__', ReplaceStringType.ATTRIBUTE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
