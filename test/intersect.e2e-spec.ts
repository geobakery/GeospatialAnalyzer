import { Test, TestingModule } from '@nestjs/testing';
// import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IntersectController } from '../src/intersect/intersect.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../src/general/general.module';
import { IntersectService } from '../src/intersect/intersect.service';

describe('IntersectController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
      imports: [
        TypeOrmModule.forRoot({
          type: process.env.db_postgres_type,
          host: process.env.db_postgres_host,
          port: process.env.db_postgres_port,
          username: process.env.db_postgres_username,
          password: process.env.db_postgres_password,
          database: process.env.db_postgres_database,
          synchronize: JSON.parse(process.env.db_postgres_synchronize),
          logging: JSON.parse(process.env.db_postgres_logging),
        } as TypeOrmModule),
        GeneralModule,
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

  it('/GET Topics', () => {
    return app
      .inject({
        method: 'GET',
        url: '/intersect/topics',
      })
      .then((result) => {
        expect(result.statusCode).toEqual(200);
        expect(result.statusMessage).toEqual('OK');
        expect(JSON.parse(result.body)).toEqual(['testTopic']);
      });
  });

  // TODO post response currently gives a 500 error, because of the missing Entities dataSource, which cannot be loaded in testing
  // TypeOrmModule.forFeature([LandEntity, KreisEntity]) in GeneralModule will not be filled and has to be mocked
  // mocking for this e2e test seems not to be useful in my opinion
  // alternative: remove repositories and use raw sql statements similar to nearestNeighbour

  it('/POST Intersect', () => {
    const body = {
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [411967, 5659861],
            crs: {
              type: 'name',
              properties: {
                name: 'EPSG:25833',
              },
            },
          },
          properties: {
            name: 'Dinagat Islands',
          },
        },
      ],
      topics: ['verw_kreis_f'],
      error: '',
      count: 2,
      timeout: 60000,
    };
    return app
      .inject({
        method: 'POST',
        url: '/intersect',
        payload: body,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      })
      .then((result) => {
        console.log('result response', result);
        expect(result.statusCode).toEqual(200);
        expect(result.statusMessage).toEqual('OK');
        // expect(JSON.parse(result.body)).toEqual(['testTopic']);
      });
  });
});
