import { Injectable } from '@nestjs/common';
import { DbAdapterService } from '../db-adapter.service';
import { methodeParameter } from '../general.interface';
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
  getGeoIntersectMethode(options?: methodeParameter): string {
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
  getGeoValueMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoValue() + '(' + p1 + COMMA + p2 + ')';
    }
    return;
  }

  getGeoRast(): string {
    return 'rast';
  }

  getGeoTransform(): string {
    return 'ST_TRANSFORM';
  }

  getGeoWithin(): string {
    return 'ST_WITHIN';
  }
  getGeoWithinMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoWithin() + '(' + p1 + COMMA + p2 + ')';
    }
  }

  getGeoDistance(): string {
    return 'ST_DISTANCE';
  }

  getGeoDistanceMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoDistance() + '(' + p1 + COMMA + p2 + ')';
    }
  }
  getOrderBy(): string {
    return 'ORDER BY';
  }
  getLimit(): string {
    return super.getLimit();
  }
  getJsonStructure(): string {
    return (
      'SELECT json_build_object(\n' +
      "    'type', 'FeatureCollection',\n" +
      "    'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::json)\n" +
      '  ) as response'
    );
  }
}
