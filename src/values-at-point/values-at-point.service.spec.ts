import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValuesAtGridService } from './values-at-point.service';
import { GeneralService } from '../general/general.service';
import { TransformService } from '../transform/transform.service';
import { PostgresService } from '../general/adapter/postgres.service';

function makeFakeQueryBuilder() {
  const params: Record<string, unknown> = {};
  let sql = '';
  const qb: any = {
    select: jest.fn().mockImplementation((e: string) => {
      sql += ` SELECT ${e}`;
      return qb;
    }),
    addSelect: jest.fn().mockImplementation((e: string) => {
      sql += ` , ${e}`;
      return qb;
    }),
    from: jest.fn().mockImplementation((source: any, alias?: string) => {
      sql += ` FROM (${typeof source === 'string' ? source : '<subquery>'}) ${alias ?? ''}`;
      return qb;
    }),
    andWhere: jest.fn().mockImplementation((e: string) => {
      sql += ` AND ${e}`;
      return qb;
    }),
    createQueryBuilder: jest
      .fn()
      .mockImplementation(() => makeFakeQueryBuilder()),
    setParameter: jest.fn().mockImplementation((n: string, v: unknown) => {
      params[n] = v;
      return qb;
    }),
    setParameters: jest
      .fn()
      .mockImplementation((p: Record<string, unknown>) => {
        Object.assign(params, p);
        return qb;
      }),
    getQuery: jest.fn().mockImplementation(() => sql),
    getParameters: jest.fn().mockImplementation(() => params),
  };
  return qb;
}

describe('ValuesAtGridService – geometry type handling', () => {
  let service: ValuesAtGridService;
  let dataSource: DataSource;
  let generalService: Partial<GeneralService>;
  let transformService: Partial<TransformService>;
  let capturedQb: any;

  const sources = [
    { name: 'gelaendehoehe_dgm', source: 'ga.dgm_r', srid: 25833 },
    { name: 'oberflaechenhoehe_dom', source: 'ga.dom_r', srid: 25833 },
  ];

  function buildRequest(geometry: any) {
    return {
      topics: ['hoehe_r'],
      inputGeometries: [{ type: 'Feature', geometry, properties: {} }],
      outputFormat: 'geojson',
      returnGeometry: false,
      outSRS: 4326,
    };
  }

  beforeEach(() => {
    capturedQb = undefined;
    dataSource = {
      createQueryBuilder: jest
        .fn()
        .mockImplementation(() => makeFakeQueryBuilder()),
    } as unknown as DataSource;

    generalService = {
      getDbAdapter: jest.fn().mockReturnValue(new PostgresService()),
      dynamicValidation: jest.fn().mockResolvedValue(true),
      getAndSetGeoID: jest.fn().mockReturnValue('feature-0'),
      identifierAllowedAttributesMap: new Map([['hoehe_r', []]]),
      identifierValueMetadataMap: new Map(),
      getMultipleDBNamesForIdentifier: jest.fn().mockReturnValue(sources),
      calculateMethode: jest.fn().mockImplementation(async (_args, qb) => {
        capturedQb = qb;
        return [];
      }),
    } as unknown as GeneralService;

    transformService = {
      normalizeInputGeometries: jest.fn().mockImplementation((geoms) => geoms),
    } as unknown as TransformService;

    service = new ValuesAtGridService(
      dataSource,
      generalService as GeneralService,
      transformService as TransformService,
    );
  });

  it('rejects unsupported geometry types (e.g. MultiPolygon) with a 400 error', async () => {
    await expect(
      service.handleRequest(
        buildRequest({
          type: 'MultiPolygon',
          coordinates: [],
        }) as any,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a null geometry with a 400 error', async () => {
    await expect(
      service.handleRequest(buildRequest(null) as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('builds one sub-query per source (dgm + dom) for a Point request', async () => {
    await service.handleRequest(
      buildRequest({
        type: 'Point',
        coordinates: [13.78, 51.03],
      }) as any,
    );
    const sql = capturedQb.getQuery();
    expect(sql).toMatch(/gelaendehoehe_dgm/);
    expect(sql).toMatch(/oberflaechenhoehe_dom/);
  });

  it('builds one sub-query per source (dgm + dom) for a LineString request', async () => {
    await service.handleRequest(
      buildRequest({
        type: 'LineString',
        coordinates: [
          [13.78, 51.03],
          [13.79, 51.04],
        ],
      }) as any,
    );
    const sql = capturedQb.getQuery();
    expect(sql).toMatch(/gelaendehoehe_dgm/);
    expect(sql).toMatch(/oberflaechenhoehe_dom/);
  });

  it('builds one sub-query per source (dgm + dom) for a Polygon request', async () => {
    await service.handleRequest(
      buildRequest({
        type: 'Polygon',
        coordinates: [
          [
            [13.78, 51.03],
            [13.79, 51.03],
            [13.79, 51.04],
            [13.78, 51.03],
          ],
        ],
      }) as any,
    );
    const sql = capturedQb.getQuery();
    expect(sql).toMatch(/gelaendehoehe_dgm/);
    expect(sql).toMatch(/oberflaechenhoehe_dom/);
  });

  describe('decimalPlaces_eachGeometry', () => {
    const point = { raw: true as const, value: 'pt' };
    const raster = { raw: true as const, value: 'rast' };
    const feature = { raw: true as const, value: ':feature_wkt_0' };
    const distance = { raw: true as const, value: ':interpolation_distance_0' };
    let adapter: PostgresService;

    beforeEach(() => {
      adapter = new PostgresService();
    });

    describe('getValueAtFeature', () => {
      it('does not round without decimalPlaces', () => {
        expect(adapter.getValueAtFeature(point, raster)).toBe(
          'ST_Value(rast, pt)',
        );
      });
      it('rounds to the configured number of places', () => {
        expect(adapter.getValueAtFeature(point, raster, 2)).toBe(
          'ROUND((ST_Value(rast, pt))::numeric, 2)',
        );
      });
      it('treats 0 as configured, not as missing', () => {
        expect(adapter.getValueAtFeature(point, raster, 0)).toContain(
          '::numeric, 0)',
        );
      });
      it.each([[-1], [1.5], [NaN], ['2' as unknown as number]])(
        'rejects %p',
        (value) => {
          expect(() => adapter.getValueAtFeature(point, raster, value)).toThrow(
            'decimalPlaces must be an integer >= 0',
          );
        },
      );
    });

    describe('getPolygonValueStats', () => {
      const sql = (places?: number) =>
        adapter.getPolygonValueStats(feature, 'ga.dgm_r', 'dgm', 25833, places);

      it('does not round without decimalPlaces', () => {
        expect(sql()).not.toContain('ROUND(');
      });
      it('rounds min, max, sum and mean to n places and stddev to n + 1', () => {
        const result = sql(1);
        for (const key of ['min', 'max', 'sum', 'mean']) {
          expect(result).toContain(`ROUND(((stats).${key})::numeric, 1)`);
        }
        expect(result).toContain('ROUND(((stats).stddev)::numeric, 2)');
      });
      it('uses 0 and 1 places for decimalPlaces 0', () => {
        const result = sql(0);
        expect(result).toContain('ROUND(((stats).min)::numeric, 0)');
        expect(result).toContain('ROUND(((stats).stddev)::numeric, 1)');
      });
      it('does not round the pixel count', () => {
        expect(sql(2)).toContain("'pixel_haveValue',  (stats).count");
      });
    });

    describe('getLineValueProfile', () => {
      const sql = (places?: number) =>
        adapter.getLineValueProfile(
          feature,
          distance,
          'ga.dgm_r',
          'dgm',
          25833,
          places,
        );

      it('does not round values without decimalPlaces, the chainage is always rounded', () => {
        const result = sql();
        expect(result).not.toContain('ROUND((MIN(value))');
        expect(result).not.toContain('ROUND((value)::numeric');
        expect(result).toContain('ROUND(distance_from_start::numeric, 2)');
      });
      it('rounds the statistics and the profile points', () => {
        const result = sql(3);
        for (const fn of ['MIN', 'MAX', 'SUM', 'AVG']) {
          expect(result).toContain(`ROUND((${fn}(value))::numeric, 3)`);
        }
        expect(result).toContain('ROUND((STDDEV(value))::numeric, 4)');
        expect(result).toContain('ROUND((value)::numeric, 3)');
      });
      it('leaves the chainage at 2 places', () => {
        expect(sql(5)).toContain('ROUND(distance_from_start::numeric, 2)');
      });
    });
  });

  describe('decimalPlaces_general', () => {
    const configure = (
      topicLevel: number | undefined,
      sourceLevels: Array<number | undefined>,
    ) => {
      (
        generalService.getMultipleDBNamesForIdentifier as jest.Mock
      ).mockReturnValue(
        sources.map((s, i) => ({ ...s, decimalPlaces: sourceLevels[i] })),
      );
      (generalService as any).identifierValueMetadataMap = new Map(
        topicLevel === undefined
          ? []
          : [['hoehe_r', { decimalPlaces: topicLevel }]],
      );
    };

    // Places of every ROUND(..., n) in the generated SQL, in order.
    const placesIn = (sql: string) =>
      [...sql.matchAll(/::numeric, (\d+)\)/g)].map((m) => Number(m[1]));

    const point = { type: 'Point', coordinates: [13.78, 51.03] };
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [13.78, 51.03],
          [13.79, 51.03],
          [13.79, 51.04],
          [13.78, 51.03],
        ],
      ],
    };

    it('does not round when nothing is configured', async () => {
      configure(undefined, [undefined, undefined]);
      await service.handleRequest(buildRequest(point) as any);
      expect(placesIn(capturedQb.getQuery())).toEqual([]);
    });

    it('uses the topic level when the source has none', async () => {
      configure(2, [undefined, undefined]);
      await service.handleRequest(buildRequest(point) as any);
      expect(placesIn(capturedQb.getQuery())).toEqual([2, 2]);
    });

    it('a source value overrides the topic value', async () => {
      configure(1, [3, undefined]);
      await service.handleRequest(buildRequest(point) as any);
      expect(placesIn(capturedQb.getQuery())).toEqual([3, 1]);
    });

    it('a source value of 0 overrides the topic value instead of falling back', async () => {
      configure(2, [0, undefined]);
      await service.handleRequest(buildRequest(point) as any);
      expect(placesIn(capturedQb.getQuery())).toEqual([0, 2]);
    });

    it('rounds the polygon statistics, stddev with one more place', async () => {
      configure(undefined, [1, undefined]);
      await service.handleRequest(buildRequest(polygon) as any);
      expect(placesIn(capturedQb.getQuery())).toEqual([1, 1, 1, 1, 2]);
    });
  });
});
