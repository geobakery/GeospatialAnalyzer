import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ValuesAtPointService } from './values-at-point.service';
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

describe('ValuesAtPointService – geometry type handling', () => {
  let service: ValuesAtPointService;
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
      getMultipleDBNamesForIdentifier: jest.fn().mockReturnValue(sources),
      calculateMethode: jest.fn().mockImplementation(async (_args, qb) => {
        capturedQb = qb;
        return [];
      }),
    } as unknown as GeneralService;

    transformService = {
      normalizeInputGeometries: jest.fn().mockImplementation((geoms) => geoms),
    } as unknown as TransformService;

    service = new ValuesAtPointService(
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
  });

  it('uses the line height profile (ST_LineInterpolatePoint, candidate tiles) for a LineString', async () => {
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
    expect(sql).toMatch(/candidate_tiles/i);
    expect(sql).toMatch(/ST_Value/i);
  });

  it('rejects Polygon geometries with a clear 400 error, not a silent/wrong query', async () => {
    await expect(
      service.handleRequest(
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
      ),
    ).rejects.toThrow(BadRequestException);
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
});
