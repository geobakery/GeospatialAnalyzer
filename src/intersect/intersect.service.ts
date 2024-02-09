import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType, SINGLE_SPACE } from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { DbAdapterService } from '../general/db-adapter.service';

let intersectWhereClause: string = null;
let intersectFromClause: string = null;

@Injectable()
export class IntersectService {
  private adapter: DbAdapterService = this.generalService.getDbAdapter();
  constructor(private generalService: GeneralService) {
    // Build DB string once
    intersectWhereClause =
      this.adapter.getWhere() +
      this.adapter.getGeoIntersectMethode({
        parameter1: 'customFromSelect.geom',
        parameter2: '__c__',
      });

    intersectFromClause =
      this.adapter.getFrom() +
      '(' +
      this.adapter.getSelect() +
      '__b__' +
      SINGLE_SPACE +
      this.adapter.getFrom() +
      '__a__' +
      ')' +
      SINGLE_SPACE +
      this.adapter.getAs() +
      'customFromSelect';
  }
  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'intersect',
    );
  }

  async calculateIntersect(
    args: ParameterDto,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
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
