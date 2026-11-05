import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValuesAtGridService } from './values-at-grid.service';
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
      const subQuery =
        typeof source === 'string'
          ? source
          : (source?.getQuery?.() ?? '<subquery>');

      sql += ` FROM (${subQuery}) ${alias ?? ''}`;
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

      query: jest.fn().mockResolvedValue([
        {
          is_valid: true,
          reason: 'Valid Geometry',
        },
      ]),
    } as unknown as DataSource;

    generalService = {
      getDbAdapter: jest.fn().mockReturnValue(new PostgresService()),
      dynamicValidation: jest.fn().mockResolvedValue(true),
      getAndSetGeoID: jest.fn().mockReturnValue('feature-0'),
      identifierAllowedAttributesMap: new Map([['hoehe_r', []]]),
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

  it('uses ST_Value/ST_Intersects for a Point, without touching the line profile SQL', async () => {
    await service.handleRequest(
      buildRequest({ type: 'Point', coordinates: [13.78, 51.03] }) as any,
    );
    const sql = capturedQb.getQuery();
    expect(sql).toMatch(/ST_Value/i);
    expect(sql).not.toMatch(/ST_LineInterpolatePoint/i);
    expect(sql).not.toMatch(/ST_SummaryStats/i);
  });

  it('uses per-point lookups via the spatial index for a LineString', async () => {
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
    expect(sql).toMatch(/ST_LineInterpolatePoint/i);
    expect(sql).toMatch(/sample_points/i);
    expect(sql).toMatch(/point_values/i);
    expect(sql).toMatch(/ST_Value/i);
    expect(sql).toMatch(/'mean',\s*AVG\(value\)/i);
  });

  it('uses the polygon value stats (ST_Union, ST_Clip, ST_SummaryStats) for a Polygon', async () => {
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
    expect(sql).toMatch(/ST_Transform/i);
    expect(sql).toMatch(/ST_Intersects/i);
    expect(sql).toMatch(/ST_Clip/i);
    expect(sql).toMatch(/ST_SummaryStatsAgg/i);

    expect(sql).toMatch(/ga\.dgm_r/i);
    expect(sql).toMatch(/ga\.dom_r/i);

    expect(sql).toMatch(/'min',\s*\(stats\)\.min/i);
    expect(sql).toMatch(/'max',\s*\(stats\)\.max/i);
    expect(sql).toMatch(/'sum',\s*\(stats\)\.sum/i);
    expect(sql).toMatch(/'mean',\s*\(stats\)\.mean/i);
    expect(sql).toMatch(/'stddev',\s*\(stats\)\.stddev/i);

    expect(sql).toMatch(/'count',\s*total_count/i);
    expect(sql).toMatch(/'countWithValue',\s*count_with_value/i);
    expect(sql).toMatch(
      /'countNoValue',\s*total_count\s*-\s*count_with_value/i,
    );

    expect(sql).toMatch(/ST_Count\(pixel_count_mask,\s*1,\s*true\)/i);
    expect(sql).toMatch(/ST_SummaryStatsAgg\(rast,\s*1,\s*true\)/i);

    expect(dataSource.query).toHaveBeenCalledWith(
      expect.stringMatching(/ST_IsValid/i),
      expect.any(Array),
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
    expect(sql).toMatch(/ga\.dgm_r/i);
    expect(sql).toMatch(/ga\.dom_r/i);
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
    expect(sql).toMatch(/ga\.dgm_r/i);
    expect(sql).toMatch(/ga\.dom_r/i);
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
    expect(sql).toMatch(/ga\.dgm_r/i);
    expect(sql).toMatch(/ga\.dom_r/i);
  });
});
