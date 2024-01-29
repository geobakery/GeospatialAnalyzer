import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType } from '../general/general.constants';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';

const VALUE_SELECT_CLAUSE =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  ') as response';

const VALUE_FROM_CLAUSE = 'FROM ( __d__ ) as customFromSelect'; // TODO
const SELECT_LOOP =
  'SELECT __a__ \n' + // attribute
  'ST_VALUE(__hr.rast, __b__) as __height\n' + //geometry
  'FROM __c__ __hr\n' + // table
  'WHERE ST_INTERSECTS(__b__, __hr.rast)'; // geometry

@Injectable()
export class ValuesAtPointService {
  constructor(private generalService: GeneralService) {}
  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'valuesAtPoint',
    );
  }

  async calculateValuesAtPoint(
    args: ParameterDto,
  ): Promise<GeoJsonDto[] | EsriJsonDto[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: true,
      customStatement: true,
      selectStatement: VALUE_SELECT_CLAUSE,
      where: false,
      from: true,
      fromStatement: VALUE_FROM_CLAUSE,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a__', ReplaceStringType.ATTRIBUTE],
        ['__b__', ReplaceStringType.GEOMETRY],
        ['__c__', ReplaceStringType.TABLE],
        ['__d__', ReplaceStringType.LOOP],
      ]),
      attachments: new Map<string, string>([['__d__', SELECT_LOOP]]),
      mockGeometry: true,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
