import { Injectable } from '@nestjs/common';
import { methodeParameter } from './general.interface';
import { SINGLE_SPACE } from './general.constants';

@Injectable()
export class DbAdapterService {
  constructor() {}

  getSelect(): string {
    return 'SELECT' + SINGLE_SPACE;
  }
  getFrom(): string {
    return 'FROM' + SINGLE_SPACE;
  }
  getWhere(): string {
    return 'WHERE' + SINGLE_SPACE;
  }
  getUnion(): string {
    return 'UNION' + SINGLE_SPACE;
  }
  getUnionAll(): string {
    return 'UNION ALL' + SINGLE_SPACE;
  }
  getGeoUnion(): string {
    return null;
  }
  getGeoIntersect(): string {
    return null;
  }
  getGeoIntersectMethode(options: methodeParameter): string {
    return String(options);
  }
  getBuffer(): string {
    return null;
  }
  getAs(): string {
    return 'AS' + SINGLE_SPACE;
  }
  getGeoValue(): string {
    return null;
  }
  getGeoValueMethode(options: methodeParameter): string {
    return String(options);
  }
  getGeoRast(): string {
    return null;
  }
  getGeoTransform(): string {
    return null;
  }
  getGeoWithin(): string {
    return null;
  }
  getGeoWithinMethode(options: methodeParameter): string {
    return String(options);
  }

  getGeoDistance(): string {
    return null;
  }
  getGeoDistanceMethode(options: methodeParameter): string {
    return String(options);
  }
  getOrderBy(): string {
    return null;
  }
  getLimit(): string {
    return 'LIMIT' + SINGLE_SPACE;
  }
  getJsonStructure(): string {
    return null;
  }
}
