import { Test, TestingModule } from '@nestjs/testing';
import { NearestNeighbourController } from './nearest-neighbour.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../general/general.module';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

describe('NearestNeighbourController', () => {
  let controller: NearestNeighbourController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
          connectTimeoutMS: 10000,
          synchronize: false,
          logging: false,
        } as TypeOrmModule),
        GeneralModule,
      ],
      providers: [NearestNeighbourService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<NearestNeighbourController>(
      NearestNeighbourController,
    );
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
