import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType, STANDARD_CRS } from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';

const INTERSECT_WHERE_CLAUSE =
  'WHERE ST_intersects(ST_Transform(customFromSelect.geom,' +
  STANDARD_CRS +
  "), '__c'::geometry)";
const INTERSECT_FROM = 'FROM (SELECT __b FROM __a ) AS customFromSelect';

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
        ['__c', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: INTERSECT_FROM,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a', ReplaceStringType.TABLE],
        ['__b', ReplaceStringType.ATTRIBUTE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
