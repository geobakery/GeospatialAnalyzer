import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import {
  _AS_STATEMENT,
  _FROM_STATEMENT,
  _SELECT_STATEMENT,
  _WHERE_STATEMENT,
  ReplaceStringType,
  SINGLE_SPACE,
} from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { DbAdapterService } from '../general/db-adapter.service';

let intersectWhereClause: string = null;
let intersectFromClause: string = null;

@Injectable()
export class IntersectService {
  private adapter: DbAdapterService = this.generalService.getDbAdapter();
  constructor(private generalService: GeneralService) {
    intersectWhereClause =
      this.adapter.getWhere() +
      SINGLE_SPACE +
      this.adapter.getGeoIntersectMethode({
        parameter1: 'customFromSelect.geom',
        parameter2: '__c__',
      });

    intersectFromClause =
      this.adapter.getFrom() +
      '(' +
      this.adapter.getSelect() +
      SINGLE_SPACE +
      '__b__' +
      SINGLE_SPACE +
      this.adapter.getFrom() +
      SINGLE_SPACE +
      '__a__' +
      ')' +
      this.adapter.getAs() +
      SINGLE_SPACE +
      'customFromSelect';
  }
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
      whereStatement: intersectWhereClause,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__c__', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: intersectFromClause,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.TABLE],
        ['__b__', ReplaceStringType.ATTRIBUTE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
