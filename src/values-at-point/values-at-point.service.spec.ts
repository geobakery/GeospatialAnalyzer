import { DataSource } from 'typeorm';
import { ValuesAtPointService } from './values-at-point.service';
import { GeneralService } from '../general/general.service';
import { TransformService } from '../transform/transform.service';
import { PostgresService } from '../general/adapter/postgres.service';

function makeFakeQueryBuilder() {
  const params: Record<string, unknown> = {};
  let sql = '';

  const qb: any = {
    select: jest.fn((e: string) => {
      sql += ` SELECT ${e}`;
      return qb;
    }),
    addSelect: jest.fn((e: string) => {
      sql += ` , ${e}`;
      return qb;
    }),
    from: jest.fn((source: any, alias?: string) => {
      sql += ` FROM (${typeof source === 'string' ? source : '<subquery>'}) ${alias ?? ''}`;
      return qb;
    }),
    andWhere: jest.fn((e: string) => {
      sql += ` AND ${e}`;
      return qb;
    }),
    createQueryBuilder: jest.fn(() => makeFakeQueryBuilder()),
    setParameter: jest.fn((n: string, v: unknown) => {
      params[n] = v;
      return qb;
    }),
    setParameters: jest.fn((p: Record<string, unknown>) => {
      Object.assign(params, p);
      return qb;
    }),
    getQuery: jest.fn(() => sql),
    getParameters: jest.fn(() => ({ ...params })),
  };

  return qb;
}

describe('ValuesAtPointService', () => {
  let service: ValuesAtPointService;
  let dataSource: DataSource;
  let generalService: Partial<GeneralService>;
  let transformService: Partial<TransformService>;
  let capturedQb: any;

  const sources = [
    { name: 'gelaendehoehe_dgm', source: 'ga.dgm_r', srid: 25833 },
    { name: 'oberflaechenhoehe_dom', source: 'ga.dom_r', srid: 25833 },
  ];

  const buildRequest = (geometry: any) => ({
    topics: ['hoehe_r'],
    inputGeometries: [{ type: 'Feature', geometry, properties: {} }],
    outputFormat: 'geojson',
    returnGeometry: false,
    outSRS: 4326,
  });

  const point = {
    type: 'Point',
    coordinates: [13.78, 51.03],
  };

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

  const placesIn = (sql: string) =>
    [...sql.matchAll(/::numeric,\s*(\d+)\)/g)].map((m) => Number(m[1]));

  beforeEach(() => {
    capturedQb = undefined;

    dataSource = {
      createQueryBuilder: jest.fn(() => makeFakeQueryBuilder()),
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
    };

    transformService = {
      normalizeInputGeometries: jest.fn((geoms) => geoms),
    };

    service = new ValuesAtPointService(
      dataSource,
      generalService as GeneralService,
      transformService as TransformService,
    );
  });

  describe('geometry handling', () => {
    it.each([
      ['Point', point],
      [
        'LineString',
        {
          type: 'LineString',
          coordinates: [
            [13.78, 51.03],
            [13.79, 51.04],
          ],
        },
      ],
      ['Polygon', polygon],
    ])('creates a query for both sources with %s', async (_, geometry) => {
      await service.handleRequest(buildRequest(geometry) as any);

      const sql = capturedQb.getQuery();

      expect(sql).toContain('gelaendehoehe_dgm');
      expect(sql).toContain('oberflaechenhoehe_dom');
      expect(sql).toContain('UNION ALL');
    });
  });

  describe('decimalPlaces adapter', () => {
    const adapter = new PostgresService();
    const pointParam = { raw: true as const, value: 'pt' };
    const raster = { raw: true as const, value: 'rast' };

    it('rounds raster values correctly', () => {
      expect(adapter.getValueAtFeature(pointParam, raster)).toBe(
        'ST_Value(rast, pt)',
      );

      expect(adapter.getValueAtFeature(pointParam, raster, 2)).toBe(
        'ROUND((ST_Value(rast, pt))::numeric, 2)',
      );

      expect(adapter.getValueAtFeature(pointParam, raster, 0)).toContain(
        '::numeric, 0)',
      );
    });

    it.each([-1, 1.5, NaN, Infinity, '2' as unknown as number])(
      'rejects invalid decimalPlaces: %p',
      (value) => {
        expect(() =>
          adapter.getValueAtFeature(pointParam, raster, value),
        ).toThrow('decimalPlaces must be an integer >= 0');
      },
    );
  });

  describe('decimalPlaces configuration', () => {
    const configure = (
      topicLevel: number | undefined,
      sourceLevels: Array<number | undefined>,
    ) => {
      (
        generalService.getMultipleDBNamesForIdentifier as jest.Mock
      ).mockReturnValue(
        sources.map((s, i) => ({
          ...s,
          decimalPlaces: sourceLevels[i],
        })),
      );

      (generalService as any).identifierValueMetadataMap = new Map(
        topicLevel === undefined
          ? []
          : [['hoehe_r', { decimalPlaces: topicLevel }]],
      );
    };

    it.each([
      [undefined, [undefined, undefined], []],
      [2, [undefined, undefined], [2, 2]],
      [1, [3, undefined], [3, 1]],
      [2, [0, undefined], [0, 2]],
    ])(
      'uses topic/source decimalPlaces correctly',
      async (topic, sourceLevels, expected) => {
        configure(topic, sourceLevels);

        await service.handleRequest(buildRequest(point) as any);

        expect(placesIn(capturedQb.getQuery())).toEqual(expected);
      },
    );
  });
});
