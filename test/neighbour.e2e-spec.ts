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
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';

describe('IntersectController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.dev', '.env'],
          load: [configuration],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: process.env.geospatial_analyzer_db_type,
          host: 'localhost',
          port: process.env.geospatial_analyzer_db_port,
          username: process.env.geospatial_analyzer_db_username,
          password: process.env.geospatial_analyzer_db_password,
          database: process.env.geospatial_analyzer_db_database,
          synchronize: false,
          logging: false,
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
            coordinates: [13.75, 51.07],
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
