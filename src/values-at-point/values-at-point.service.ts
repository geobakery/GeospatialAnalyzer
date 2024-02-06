import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType, SINGLE_SPACE } from '../general/general.constants';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { DbAdapterService } from '../general/db-adapter.service';

let valueFromClause = 'FROM ( __d__ ) as customFromSelect'; // TODO
let selectLoop =
  'SELECT __a__ \n' + // attribute
  'ST_VALUE(__hr.rast, __b__) as __height\n' + //geometry
  'FROM __c__ __hr\n' + // table
  'WHERE ST_INTERSECTS(__b__, __hr.rast)'; // geometry

@Injectable()
export class ValuesAtPointService {
  private adapter: DbAdapterService = this.generalService.getDbAdapter();

  constructor(private generalService: GeneralService) {
    valueFromClause =
      this.adapter.getFrom() +
      SINGLE_SPACE +
      '(' +
      '__d__' +
      ')' +
      SINGLE_SPACE +
      this.adapter.getAs() +
      SINGLE_SPACE +
      'customFromSelect';
    selectLoop =
      this.adapter.getSelect() +
      SINGLE_SPACE +
      '__a__' +
      SINGLE_SPACE +
      this.adapter.getGeoValueMethode({
        parameter1: '__hr.' + this.adapter.getGeoRast(),
        parameter2: '__b__',
      }) +
      SINGLE_SPACE +
      this.adapter.getAs() +
      SINGLE_SPACE +
      '__height' +
      SINGLE_SPACE +
      this.adapter.getFrom() +
      SINGLE_SPACE +
      '__c__' +
      SINGLE_SPACE +
      '__hr' +
      SINGLE_SPACE +
      this.adapter.getWhere() +
      SINGLE_SPACE +
      this.adapter.getGeoIntersectMethode({
        parameter1: '__b__',
        parameter2: '__hr.' + this.adapter.getGeoRast(),
      });
  }
  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'valuesAtPoint',
    );
  }

  async calculateValuesAtPoint(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: false,
      from: true,
      fromStatement: valueFromClause,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.ATTRIBUTE],
        ['__b__', ReplaceStringType.GEOMETRY],
        ['__c__', ReplaceStringType.TABLE],
        ['__d__', ReplaceStringType.LOOP],
      ]),
      attachments: new Map<string, string>([['__d__', selectLoop]]),
      mockGeometry: true,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
