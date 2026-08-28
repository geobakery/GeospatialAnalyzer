import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { setUpOpenAPIAndValidation } from '../src/app-init';
import { GeneralModule } from '../src/general/general.module';
import { IntersectController } from '../src/intersect/intersect.controller';
import { IntersectService } from '../src/intersect/intersect.service';
import { MetricsModule } from '../src/metrics/metrics.module';
import { TransformModule } from '../src/transform/transform.module';
import { createE2eTestModules } from './helpers/database.helper';
import {
  HEADERS_JSON,
  INTERSECT_URL,
  POST,
  URL_START,
} from './common/constants';
import { getGeoJSONFeature } from './common/testDataPreparer';

/**
 * The database metrics are collected by monkey-patching
 * `SelectQueryBuilder.prototype` (see database-metrics.subscriber.ts), which the
 * type system does not cover. metrics.e2e-spec.ts only checks that the metric is
 * registered, so a renamed method would leave the counters at zero unnoticed.
 */
describe('Database metrics (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
      imports: [
        ...createE2eTestModules(),
        GeneralModule,
        TransformModule,
        MetricsModule.forRoot(),
      ],
      providers: [IntersectService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await setUpOpenAPIAndValidation(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  /** Sums all samples of a counter, optionally filtered by a label substring. */
  function sumMetric(body: string, metric: string, labelFilter = ''): number {
    return body
      .split('\n')
      .filter((line) => line.startsWith(`${metric}{`))
      .filter((line) => line.includes(labelFilter))
      .reduce((total, line) => {
        const value = Number(line.slice(line.lastIndexOf('}') + 1).trim());
        return Number.isFinite(value) ? total + value : total;
      }, 0);
  }

  async function getMetricsBody(): Promise<string> {
    const response = await app.inject({ method: 'GET', url: '/metrics' });
    expect(response.statusCode).toBe(200);
    return response.body;
  }

  it('counts and times a database query after an intersect request', async () => {
    const before = sumMetric(
      await getMetricsBody(),
      'geospatialanalyzer_db_queries_total',
    );

    const input = await getGeoJSONFeature({
      topics: ['kreis_f'],
      returnGeometry: false,
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    expect(result.statusCode).toBe(200);

    const body = await getMetricsBody();

    expect(
      sumMetric(body, 'geospatialanalyzer_db_queries_total'),
    ).toBeGreaterThan(before);
    expect(
      sumMetric(
        body,
        'geospatialanalyzer_db_queries_total',
        'status="success"',
      ),
    ).toBeGreaterThan(0);
    expect(
      sumMetric(body, 'geospatialanalyzer_db_query_duration_seconds_count'),
    ).toBeGreaterThan(0);
  });
});
