import { Injectable } from '@nestjs/common';
import { methodeParameter } from './general.interface';

@Injectable()
export class DbAdapterService {
  constructor() {}

  getSelect(): string {
    return 'SELECT';
  }
  getFrom(): string {
    return 'FROM';
  }
  getWhere(): string {
    return 'WHERE';
  }
  getUnion(): string {
    return 'UNION';
  }
  getUnionAll(): string {
    return 'UNION ALL';
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
    return 'AS';
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
    return 'LIMIT';
  }
  getJsonStructure(): string {
    return null;
  }
}
