import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('TopicsController', () => {
  let controller: TopicsController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [TopicsService],
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
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
    mod = module;
  });

  afterEach(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
