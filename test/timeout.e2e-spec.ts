import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryFailedError, SelectQueryBuilder } from 'typeorm';
import {
  HTTP_STATUS_SQL_TIMEOUT,
  SQLSTATE_QUERY_CANCELED,
} from '../src/general/general.constants';
import { GeneralModule } from '../src/general/general.module';
import {
  GeneralService,
  GeospatialResultEntity,
} from '../src/general/general.service';
import { TransformModule } from '../src/transform/transform.module';
import { GEOJSON_WITHOUT_GEOMETRY_KREIS } from './common/constants';
import { createTestModules } from './helpers/database.helper';

/**
 * Pins down the contract this service relies on but cannot control: that a
 * statement cancelled by the database really does arrive as SQLSTATE 57014.
 * Only a real driver error can show that, which is why this runs against a
 * database instead of a hand-built QueryFailedError.
 *
 * The complementary half - that the mapping keys off the SQLSTATE and not off
 * the message, whose language depends on the server's lc_messages - lives in
 * src/general/general.service.spec.ts, where the error can be varied freely.
 * The client-side read timeout is only covered there: pinning it against a real
 * driver needs a second connection pool, which leaks when torn down while the
 * abandoned statement still runs.
 */
describe('SQL timeout handling (e2e)', () => {
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        // 1 ms is below any real query's runtime, so the cancellation is
        // deterministic instead of the test racing a threshold.
        ...createTestModules([], { statementTimeout: 1 }),
        GeneralModule,
        TransformModule,
      ],
    }).compile();
    await moduleFixture.init();
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  it('maps a statement cancelled by the database to the timeout status', async () => {
    const dataSource = moduleFixture.get(DataSource);
    const generalService = moduleFixture.get(GeneralService);

    const failingQueryBuilder = dataSource
      .createQueryBuilder()
      .select('pg_sleep(2)')
      .from(
        '(select 1)',
        'delay',
      ) as unknown as SelectQueryBuilder<GeospatialResultEntity>;

    const driverFailure: unknown = await failingQueryBuilder
      .getRawMany()
      .catch((e: unknown) => e);

    expect(driverFailure).toBeInstanceOf(QueryFailedError);
    // Asserted on the SQLSTATE, not the message: Postgres localises the text.
    expect((driverFailure as QueryFailedError).driverError).toMatchObject({
      code: SQLSTATE_QUERY_CANCELED,
    });

    await expect(
      generalService.calculateMethode(
        GEOJSON_WITHOUT_GEOMETRY_KREIS(),
        failingQueryBuilder,
      ),
    ).rejects.toMatchObject({ status: HTTP_STATUS_SQL_TIMEOUT });
  });
});
