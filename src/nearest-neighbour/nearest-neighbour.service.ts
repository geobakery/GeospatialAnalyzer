import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import {
  dbRequestBuilderSample,
  topicDefinitionOutside,
} from '../general/general.interface';
import { dbDirection, ReplaceStringType } from '../general/general.constants';

const NEIGHBOUR_SELECT_CLAUSE =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  ') as response';
const NEIGHBOUR_FROM_CLAUSE =
  'FROM ( SELECT "customFrom".*, ST_Distance(\'__a\'::geometry, "customFrom".geom) as __dist\n' +
  '        FROM __b "customFrom"\n' +
  '        ORDER BY __dist asc ' +
  'LIMIT __c) as customFromSelect';
@Injectable()
export class NearestNeighbourService {
  constructor(private generalService: GeneralService) {}

  getTopics(): topicDefinitionOutside[] {
    return this.generalService.getTopicsInformationForOutsideSpecific(
      'nearestNeighbour',
    );
  }

  async calculateNearestNeighbour(args: ParameterDto): Promise<GeoJSON[]> {
    // TODO validate Input, custom ParameterDto?
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: true,
      customStatement: true,
      selectStatement: NEIGHBOUR_SELECT_CLAUSE,
      where: false,
      from: true,
      fromStatement: NEIGHBOUR_FROM_CLAUSE,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a', ReplaceStringType.GEOMETRY],
        ['__b', ReplaceStringType.TABLE],
        ['__c', ReplaceStringType.COUNT],
      ]),
      count: args.count,
      orderBy: 'dist',
      orderByDirection: dbDirection.asc,
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
