import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtPointService } from './values-at-point.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { GeneralModule } from '../general/general.module';

describe('ValuesAtPointService', () => {
  let service: ValuesAtPointService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValuesAtPointService],
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
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<ValuesAtPointService>(ValuesAtPointService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
