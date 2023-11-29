import { Test, TestingModule } from '@nestjs/testing';
// import * as request from 'supertest';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../src/general/general.module';
import { NearestNeighbourController } from '../src/nearest-neighbour/nearest-neighbour.controller';
import { NearestNeighbourService } from '../src/nearest-neighbour/nearest-neighbour.service';

describe('IntersectController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
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
      providers: [NearestNeighbourService],
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

  // TODO load expected result from data and compare result
  it('/POST Neighbour', () => {
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
        url: '/nearestNeighbour',
        payload: body,
        headers: {
          'content-type': 'application/json; charset=utf-8',
        },
      })
      .then((result) => {
        console.log('yolo', result);
        expect(result.statusCode).toEqual(200);
        expect(result.statusMessage).toEqual('OK');
        // expect(JSON.parse(result.body)).toEqual(['testTopic']);
      });
  });
});
