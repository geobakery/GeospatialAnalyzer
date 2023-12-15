import { Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import { dbRequestBuilderSample } from '../general/general.interface';
import { ReplaceStringType } from '../general/general.constants';

/***
 * current help Request:
 * {
 *     "inputGeometries": [{
 *         "type": "Feature",
 *         "geometry": {
 *             "type": "Point",
 *             "coordinates": [417929, 5651849],
 *             "crs": {
 *                  "type": "name",
 *                         "properties": {
 *                             "name": "EPSG:25833"
 *                         }
 *             }
 *         },
 *         "properties": {
 *             "name": "Dinagat Islands"
 *         }
 * }],
 *     "topics": ["verw_kreis_f"],
 *     "timeout": 60000
 * }
 */

const VALUE_SELECT_CLAUSE =
  'SELECT json_build_object(\n' +
  "    'type', 'FeatureCollection',\n" +
  "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
  ') as response';
const VALUE_FROM_CLAUSE =
  "FROM ( SELECT ST_Envelope(rast) as geom, ST_VALUE(rast, '__a'::geometry) as __height\n" +
  '        FROM spatialyzer_Demo.hoehe2m_r  ) as customFromSelect';

//TODO set placeHolfer for valuesAtPoint
// const VALUE_FROM_CLAUSE =
//     'FROM ( SELECT "customFrom".*, ST_VALUE("customFrom".rast, \'__a\'::geometry) as __height\n' +
//     '        FROM __b "customFrom" ) as customFromSelect';

@Injectable()
export class ValuesAtPointService {
  constructor(private generalService: GeneralService) {}
  getTopics(): string[] {
    return [''];
  }

  async calculateValuesAtPoint(args: ParameterDto): Promise<GeoJSON[]> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: true,
      customStatement: true,
      selectStatement: VALUE_SELECT_CLAUSE,
      where: false,
      from: true,
      fromStatement: VALUE_FROM_CLAUSE,
      fromStatementParameter: new Map<string, ReplaceStringType>([
        ['__a', ReplaceStringType.GEOMETRY],
        ['__b', ReplaceStringType.TABLE],
        ['__c', ReplaceStringType.COUNT],
      ]),
    };
    return this.generalService.calculateMethode(args, dbBuilderParameter);
  }
}
