import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { dbDirection, ReplaceStringType } from '../general/general.constants';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJsonDto } from '../general/dto/geo-json.dto';

const NEIGHBOUR_SELECT_CLAUSE =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  ') as response';
const NEIGHBOUR_FROM_CLAUSE =
  'FROM ( SELECT __d__, ST_Distance(__a__, "customFrom".geom) as __dist\n' +
  '        FROM __b__ "customFrom"\n' +
  '        ORDER BY __dist asc ' +
  'LIMIT __c__) as customFromSelect';
@Injectable()
export class NearestNeighbourService {
  constructor(private generalService: GeneralService) {}

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
      select: true,
      customStatement: true,
      selectStatement: NEIGHBOUR_SELECT_CLAUSE,
      where: false,
      from: true,
      fromStatement: NEIGHBOUR_FROM_CLAUSE,
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
