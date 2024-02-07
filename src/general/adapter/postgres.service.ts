import { Injectable } from '@nestjs/common';
import { DbAdapterService } from '../db-adapter.service';
import { methodeParameter } from '../general.interface';
import { COMMA, SINGLE_SPACE } from '../general.constants';

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
    return 'ST_UNION' + SINGLE_SPACE;
  }

  getGeoIntersect(): string {
    return 'ST_intersects' + SINGLE_SPACE;
  }
  getGeoIntersectMethode(options?: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return (
        this.getGeoIntersect() + '(' + p1 + COMMA + p2 + ')' + SINGLE_SPACE
      );
    }
  }

  getBuffer(): string {
    return super.getBuffer();
  }

  getAs(): string {
    return super.getAs();
  }

  getGeoValue(): string {
    return 'ST_VALUE' + SINGLE_SPACE;
  }
  getGeoValueMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoValue() + '(' + p1 + COMMA + p2 + ')' + SINGLE_SPACE;
    }
    return;
  }

  getGeoRast(): string {
    return 'rast' + SINGLE_SPACE;
  }

  getGeoTransform(): string {
    return 'ST_TRANSFORM' + SINGLE_SPACE;
  }

  getGeoWithin(): string {
    return 'ST_WITHIN' + SINGLE_SPACE;
  }
  getGeoWithinMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoWithin() + '(' + p1 + COMMA + p2 + ')' + SINGLE_SPACE;
    }
  }

  getGeoDistance(): string {
    return 'ST_DISTANCE' + SINGLE_SPACE;
  }

  getGeoDistanceMethode(options: methodeParameter): string {
    if (options) {
      const p1 = options.parameter1;
      const p2 = options.parameter2;
      return this.getGeoDistance() + '(' + p1 + COMMA + p2 + ')' + SINGLE_SPACE;
    }
  }
  getOrderBy(): string {
    return 'ORDER BY' + SINGLE_SPACE;
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
