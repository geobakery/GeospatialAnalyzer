import { Test, TestingModule } from '@nestjs/testing';
import { ValuesAtPointController } from './values-at-point.controller';
import { GeneralModule } from '../general/general.module';
import { ValuesAtPointService } from './values-at-point.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

describe('ValuesAtPointController', () => {
  let controller: ValuesAtPointController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.dev', '.env'],
          load: [configuration],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: process.env.geospatial_analyzer_db_type,
          host: process.env.geospatial_analyzer_db_host,
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
      providers: [ValuesAtPointService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<ValuesAtPointController>(ValuesAtPointController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
