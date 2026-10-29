import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError, SelectQueryBuilder, DataSource } from 'typeorm';
import { TransformModule } from '../transform/transform.module';
import {
  GeneralService,
  GeospatialRequest,
  GeospatialResultEntity,
} from './general.service';
import {
  HTTP_STATUS_SQL_TIMEOUT,
  PG_CLIENT_READ_TIMEOUT_MESSAGE,
  SQLSTATE_QUERY_CANCELED,
} from './general.constants';
import { topicDefinition } from './general.interface';
import { ConfigModule } from '@nestjs/config';

const TOPIC_CONFIG_EXAMPLE: topicDefinition[] = [
  {
    identifiers: ['topicA'],
    title: 'First Topic',
    description: 'Description of the first topic',
    __source__: { name: 'unused', source: 'schemaA.tableA', srid: 4326 },
    __attributes__: ['id', 'title', 'geom'],
    __supports__: ['intersect', 'within'],
    __filterGroups__: ['topicGroupOne', 'topicGroupTwo'],
  },
  {
    identifiers: ['topicB'],
    title: 'Second Topic',
    description: 'Description of the second topic',
    __source__: { name: 'unused', source: 'schemaB.tableB', srid: 4326 },
    __attributes__: ['id', 'title', 'adress', 'description'],
    __supports__: ['nearestNeighbour', 'valuesAtPoint'],
    __filterGroups__: ['topicGroupThree', 'topicGroupTwo'],
  },
  {
    identifiers: ['topicC'],
    title: 'Third Topic',
    description: 'Description of the third topic',
    __source__: { name: 'unused', source: 'schemaC.tableC', srid: 4326 },
    __attributes__: ['id', 'title', 'adress', 'description'],
    __supports__: ['nearestNeighbour', 'intersect'],
    __filterGroups__: ['topicGroupTwo'],
  },
];

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  async function setup(topicGroupFilterString?: string) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeneralService,
        {
          provide: DataSource,
          useValue: {},
        },
      ],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.test', '.env'],
          load: [
            () => ({
              __topicsConfig__: TOPIC_CONFIG_EXAMPLE,
              GEOSPATIAL_ANALYZER_TOPIC_GROUP_FILTER: topicGroupFilterString,
            }),
          ],
          isGlobal: true,
        }),
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    service = module.get<GeneralService>(GeneralService);
    mod = module;
  }

  describe('with default setup', () => {
    beforeAll(async () => await setup());
    afterAll(async () => await mod.close());

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    // example test specific function
    it('should show topics array', () => {
      const result = service.getTopics();
      expect(result).toBeDefined();
    });
  });

  // example mock function
  // We can adjust the output of a service by mocking it. If this service is called by itself or another function
  // our mocked version will always be executed (In this case it returns 1234, even the real version would return 4326)

  describe('with empty topic group filtering', () => {
    beforeAll(async () => await setup(''));
    afterAll(async () => await mod.close());

    it('should return all configured topics', () => {
      const result = service.getTopics();
      expect(result).toEqual(['topicA', 'topicB', 'topicC']);
    });
  });

  describe('with different topic group sets selected for filtering', () => {
    describe('groupOne and groupThree', () => {
      beforeAll(async () => await setup('topicGroupOne, topicGroupThree'));
      afterAll(async () => await mod.close());

      it('should return topics A and B', () => {
        const result = service.getTopics();
        expect(result).toEqual(['topicA', 'topicB']);
      });
    });

    describe('groupThree with leading whitespace', () => {
      beforeAll(async () => await setup(' topicGroupThree'));
      afterAll(async () => await mod.close());

      it('should return topics B', () => {
        const result = service.getTopics();
        expect(result).toEqual(['topicB']);
      });
    });
  });

  describe('error mapping in calculateMethode', () => {
    beforeAll(async () => await setup());
    afterAll(async () => await mod.close());

    const REQUEST: GeospatialRequest = {
      topics: ['topicA'],
      inputGeometries: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [13.75, 51.07] },
          properties: {},
        },
      ],
      outputFormat: 'geojson',
      outSRS: 4326,
      returnGeometry: false,
    };

    /**
     * Rebuilds what TypeORM does with a failing query. Hand-built on purpose:
     * only this way can message and SQLSTATE be varied independently, which is
     * what the mapping must not depend on.
     */
    function queryBuilderRejectingWith(driverError: Error) {
      return {
        getRawMany: () =>
          Promise.reject(new QueryFailedError('select 1', [], driverError)),
      } as unknown as SelectQueryBuilder<GeospatialResultEntity>;
    }

    it('maps a cancelled statement to the timeout status whatever language the message is in', async () => {
      // What a server with a German lc_messages reports - no "timeout" in it.
      const driverError = Object.assign(
        new Error('storniere Anfrage wegen Zeitüberschreitung der Anfrage'),
        { code: SQLSTATE_QUERY_CANCELED },
      );

      await expect(
        service.calculateMethode(
          REQUEST,
          queryBuilderRejectingWith(driverError),
        ),
      ).rejects.toMatchObject({ status: HTTP_STATUS_SQL_TIMEOUT });
    });

    it("maps the driver's client-side read timeout to the timeout status", async () => {
      // Fires before the statement reaches the server, hence no SQLSTATE.
      const driverError = new Error(PG_CLIENT_READ_TIMEOUT_MESSAGE);

      await expect(
        service.calculateMethode(
          REQUEST,
          queryBuilderRejectingWith(driverError),
        ),
      ).rejects.toMatchObject({ status: HTTP_STATUS_SQL_TIMEOUT });
    });

    it('maps an unrelated query failure to a server error even if its message mentions a timeout', async () => {
      const driverError = Object.assign(
        new Error('column "timeout" does not exist'),
        { code: '42703' },
      );

      await expect(
        service.calculateMethode(
          REQUEST,
          queryBuilderRejectingWith(driverError),
        ),
      ).rejects.toMatchObject({ status: HttpStatus.INTERNAL_SERVER_ERROR });
    });
  });

  describe('decimalPlaces in topic.json', () => {
    const modules: TestingModule[] = [];

    afterEach(async () => {
      await Promise.all(modules.splice(0).map((m) => m.close()));
    });

    const compileWith = async (topics: unknown[]) => {
      const module = await Test.createTestingModule({
        providers: [GeneralService, { provide: DataSource, useValue: {} }],
        imports: [
          ConfigModule.forRoot({
            envFilePath: ['.env.test', '.env'],
            load: [() => ({ __topicsConfig__: topics })],
            isGlobal: true,
          }),
          TransformModule,
        ],
      }).compile();
      modules.push(module);
      return module.get<GeneralService>(GeneralService);
    };

    const topicWithSource = (
      source: Record<string, unknown> = {},
      metadata?: unknown,
    ) => ({
      identifiers: ['rasterTopic'],
      title: 'Raster topic',
      description: 'Topic with value metadata',
      __attributes__: [],
      __supports__: [],
      ...(metadata === undefined ? {} : { __valueMetadata__: metadata }),
      __source__: {
        name: 'unused',
        source: 'schema.table',
        srid: 25833,
        ...source,
      },
    });

    describe('topic level (__valueMetadata__)', () => {
      it.each([0, 1, 2, 5])(
        'accepts the integer %i and keeps it, also 0',
        async (n) => {
          const service = await compileWith([
            topicWithSource({}, { decimalPlaces: n }),
          ]);
          expect(
            service.identifierValueMetadataMap.get('rasterTopic')
              ?.decimalPlaces,
          ).toBe(n);
        },
      );

      it('accepts a topic without decimalPlaces', async () => {
        const service = await compileWith([topicWithSource({}, { unit: 'm' })]);
        expect(
          service.identifierValueMetadataMap.get('rasterTopic')?.decimalPlaces,
        ).toBeUndefined();
      });

      it.each([[-1], [1.5], ['2'], [null], [true]])(
        'rejects %p',
        async (value) => {
          await expect(
            compileWith([topicWithSource({}, { decimalPlaces: value })]),
          ).rejects.toThrow(InternalServerErrorException);
        },
      );

      it.each([['m'], [null], [[]]])(
        'rejects %p as __valueMetadata__',
        async (metadata) => {
          await expect(
            compileWith([topicWithSource({}, metadata)]),
          ).rejects.toThrow(InternalServerErrorException);
        },
      );
    });

    describe('source level (requires the validation of Source.decimalPlaces)', () => {
      it.each([0, 3])('accepts the integer %i', async (n) => {
        await expect(
          compileWith([topicWithSource({ decimalPlaces: n })]),
        ).resolves.toBeDefined();
      });

      it.each([[-1], [1.5], ['2'], [null]])('rejects %p', async (value) => {
        await expect(
          compileWith([topicWithSource({ decimalPlaces: value })]),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('topics output', () => {
      it('exposes decimalPlaces, a source value overrides the topic value', async () => {
        const service = await compileWith([
          topicWithSource(
            { decimalPlaces: 3 },
            { unit: 'm', decimalPlaces: 1 },
          ),
        ]);
        const [info] = service.getAllTopicsInformation();
        expect(info.valueMetadata).toMatchObject({
          unit: 'm',
          decimalPlaces: 3,
        });
      });

      it('keeps decimalPlaces 0', async () => {
        const service = await compileWith([
          topicWithSource({}, { decimalPlaces: 0 }),
        ]);
        const [info] = service.getAllTopicsInformation();
        expect(info.valueMetadata).toMatchObject({ decimalPlaces: 0 });
      });
    });
  });
});
