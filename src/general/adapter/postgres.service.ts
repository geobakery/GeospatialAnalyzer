import { Injectable } from '@nestjs/common';
import { DbAdapterService } from '../db-adapter.service';
import { MethodeParameter } from '../general.interface';
import { COMMA } from '../general.constants';

@Injectable()
export class PostgresService extends DbAdapterService {
  constructor() {
    super();
  }

  getSelect(): string {
    return super.getSelect();
  }

  getFrom(): string {
    return super.getFrom();
  }

  getWhere(): string {
    return super.getWhere();
  }

  getUnion(): string {
    return super.getUnion();
  }

  getUnionAll(): string {
    return super.getUnionAll();
  }

  getGeoUnion(): string {
    return 'ST_UNION';
  }

  getGeoIntersect(): string {
    return 'ST_intersects';
  }
  getGeoIntersectMethode(options?: MethodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoIntersect() + '(' + p1 + COMMA + p2 + ')';
    }
  }

  getBuffer(): string {
    return super.getBuffer();
  }

  getAs(): string {
    return super.getAs();
  }

  getGeoValue(): string {
    return 'ST_VALUE';
  }

  getGeoRast(): string {
    return 'rast';
  }

  getGeoTransform(): string {
    return 'ST_TRANSFORM';
  }

  getGeoWithin(): string {
    return super.getGeoWithin();
  }

  getGeoDistance(): string {
    return super.getGeoDistance();
  }

  getLimit(): string {
    return super.getLimit();
  }
}
