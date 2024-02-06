import { Injectable } from '@nestjs/common';
import { MethodeParameter } from './general.interface';

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
  getGeoIntersectMethode(options?: MethodeParameter): string {
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
  getGeoRast(): string {
    return null;
  }
  getGeoTransform(): string {
    return null;
  }
  getGeoWithin(): string {
    return null;
  }
  getGeoDistance(): string {
    return null;
  }
  getLimit(): string {
    return 'LIMIT';
  }

  // TODO use methods like getTrasnform Methode=>  ST_TRANSFORM(PARA1, PARA2)
}
