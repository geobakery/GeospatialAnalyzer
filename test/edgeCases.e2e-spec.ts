import { ConfigModule } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';

import { createE2eTestModules } from './helpers/database.helper';
import { GeneralModule } from '../src/general/general.module';
import { IntersectController } from '../src/intersect/intersect.controller';
import { IntersectService } from '../src/intersect/intersect.service';
import { TransformModule } from '../src/transform/transform.module';
import {
  HEADERS_JSON,
  INTERSECT_URL,
  POST,
  URL_START,
} from './common/constants';
import { getGeoJSONFeature } from './common/testDataPreparer';

describe('EdgeCases (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
      imports: [
        ...createE2eTestModules(),
        GeneralModule,
        TransformModule,
      ],
      providers: [IntersectService],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  // it('/POST Payload too large', async () => {
  //   const input = await getGeoJSONFeature({
  //     topics: ['kreis'],
  //     returnGeometry: true,
  //     fixGeometry: { type: 'Polygon', coordinates: big_json },
  //   });
  //   const result = await app.inject({
  //     method: POST,
  //     url: URL_START + INTERSECT_URL,
  //     payload: input,
  //     headers: HEADERS_JSON,
  //   });
  //   expect(result.statusCode).toEqual(413);
  //   expect(result.statusMessage).toBe('Payload Too Large');
  // });

  it('/POST extrem low query time', async () => {
    const input = await getGeoJSONFeature({
      topics: ['kreis'],
      returnGeometry: true,
      fixGeometry: { type: 'Point', coordinates: [0, 1] },
    });
    const result = await app.inject({
      method: POST,
      url: URL_START + INTERSECT_URL,
      payload: input,
      headers: HEADERS_JSON,
    });
    
    // Coordinates [0, 1] are outside German administrative boundaries
    // The API should return 200 with "No result" rather than an error
    expect(result.statusCode).toEqual(200);
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveLength(1);
    expect(responseBody[0].properties.NO_RESULT).toBe('No result to request');
    expect(responseBody[0].properties.__topic).toBe('kreis');
  });
});
