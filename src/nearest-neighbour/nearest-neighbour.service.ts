import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import {
  COMMA,
  dbDirection,
  ReplaceStringType,
  SINGLE_SPACE,
} from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { DbAdapterService } from '../general/db-adapter.service';

let neighbourFromClause = '';
@Injectable()
export class NearestNeighbourService {
  private adapter: DbAdapterService = this.generalService.getDbAdapter();
  constructor(private generalService: GeneralService) {
    // Build DB string once
    neighbourFromClause =
      this.adapter.getFrom() +
      '(' +
      this.adapter.getSelect() +
      '__d__' +
      COMMA +
      this.adapter.getGeoDistanceMethode({
        parameter1: '__a__',
        parameter2: '"customFrom".geom',
      }) +
      this.adapter.getAs() +
      '__dist' +
      SINGLE_SPACE +
      this.adapter.getFrom() +
      '__b__' +
      SINGLE_SPACE +
      '"customFrom"' +
      SINGLE_SPACE +
      this.adapter.getOrderBy() +
      '__dist' +
      SINGLE_SPACE +
      'asc' +
      SINGLE_SPACE +
      this.adapter.getLimit() +
      '__c__' +
      ')' +
      SINGLE_SPACE +
      this.adapter.getAs() +
      'customFromSelect';
  }

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'nearestNeighbour',
    );
  }

  async calculateNearestNeighbour(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    // TODO validate Input, custom ParameterDto?
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: false,
      from: true,
      fromStatement: neighbourFromClause,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.GEOMETRY],
        ['__b__', ReplaceStringType.TABLE],
        ['__c__', ReplaceStringType.COUNT],
        ['__d__', ReplaceStringType.ATTRIBUTE],
      ]),
      count: args.count,
      orderBy: 'dist',
      orderByDirection: dbDirection.asc,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
