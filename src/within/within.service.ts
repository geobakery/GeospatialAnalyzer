import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType, SINGLE_SPACE } from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { DbAdapterService } from '../general/db-adapter.service';

let withinWhereClause = 'WHERE ST_Within(__a__, customFromSelect.geom)';
let withinFromClause = 'FROM (SELECT __b__ FROM __a__ ) AS customFromSelect';
@Injectable()
export class WithinService {
  private adapter: DbAdapterService = this.generalService.getDbAdapter();

  constructor(private generalService: GeneralService) {
    withinWhereClause =
      this.adapter.getWhere() +
      SINGLE_SPACE +
      this.adapter.getGeoWithinMethode({
        parameter1: '__a__',
        parameter2: 'customFromSelect.geom',
      }) +
      SINGLE_SPACE;
    withinFromClause =
      this.adapter.getFrom() +
      SINGLE_SPACE +
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
    return this.generalService.getTopicsInformationForOutsideSpecific('within');
  }

  async calculateWithin(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: true,
      whereStatement: withinWhereClause,
      whereStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.GEOMETRY],
      ]),
      fromStatement: withinFromClause,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.TABLE],
        ['__b__', ReplaceStringType.ATTRIBUTE],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
