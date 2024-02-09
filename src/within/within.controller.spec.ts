import { Test, TestingModule } from '@nestjs/testing';
import { WithinController } from './within.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithinService } from './within.service';
import { GeneralModule } from '../general/general.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

describe('WithinController', () => {
  let controller: WithinController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithinController],
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
      providers: [WithinService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<WithinController>(WithinController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
