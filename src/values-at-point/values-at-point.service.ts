import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ReplaceStringType, STANDARD_CRS } from '../general/general.constants';
import { GeoJsonDto } from '../general/dto/geo-json.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';

const VALUE_SELECT_CLAUSE =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  ') as response';
const VALUE_FROM_CLAUSE =
  "FROM ( SELECT ('SRID=4326;POINT (0 0)'::geometry) as geom, __c" +
  '        FROM __b  ) as customFromSelect';

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
        ['__a', ReplaceStringType.GEOMETRY],
        ['__b', ReplaceStringType.MULTIPLE_TABLES],
        ['__c', ReplaceStringType.MULTIPLE_SOURCE_RAST_DATA],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
