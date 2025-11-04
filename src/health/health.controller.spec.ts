import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../config/configuration';
import { GeneralModule } from '../general/general.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.env.dev', '.env'],
          load: [configuration],
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: process.env.GEOSPATIAL_ANALYZER_DB_TYPE,
          host: 'localhost',
          port: process.env.GEOSPATIAL_ANALYZER_DB_PORT,
          username: process.env.GEOSPATIAL_ANALYZER_DB_USERNAME,
          password: process.env.GEOSPATIAL_ANALYZER_DB_PASSWORD,
          database: process.env.GEOSPATIAL_ANALYZER_DB_DATABASE,
          connectTimeoutMS: 10000,
          synchronize: false,
          logging: false,
        } as TypeOrmModule),
        GeneralModule,
      ],
      providers: [HealthService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<HealthController>(HealthController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
