import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryFailedError, SelectQueryBuilder } from 'typeorm';
import {
  HTTP_STATUS_SQL_TIMEOUT,
  SQLSTATE_QUERY_CANCELED,
} from '../src/general/general.constants';
import { GeneralModule } from '../src/general/general.module';
import { GeneralService } from '../src/general/general.service';
import { TransformModule } from '../src/transform/transform.module';
import { createTestModules } from './helpers/database.helper';

/**
 * Covers the mapping from a cancelled statement to the dedicated timeout status
 * in GeneralService.calculateMethode. The error has to come from the driver: a
 * hand-built QueryFailedError would satisfy the service's instanceof check by
 * construction.
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
      .from('(select 1)', 'delay') as unknown as SelectQueryBuilder<never>;

    // Asserted on the SQLSTATE, not the message: Postgres localises error text.
    await expect(failingQueryBuilder.getRawMany()).rejects.toBeInstanceOf(
      QueryFailedError,
    );
    await expect(failingQueryBuilder.getRawMany()).rejects.toMatchObject({
      driverError: { code: SQLSTATE_QUERY_CANCELED },
    });

    const request = {
      topics: ['kreis_f'],
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

    await expect(
      generalService.calculateMethode(request as never, failingQueryBuilder),
    ).rejects.toMatchObject({ status: HTTP_STATUS_SQL_TIMEOUT });
  });
});
