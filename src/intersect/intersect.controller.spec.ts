import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { IntersectController } from './intersect.controller';
import { GeneralModule } from '../general/general.module';
import { IntersectService } from './intersect.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

describe('IntersectController', () => {
  let controller: IntersectController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
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
      providers: [IntersectService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<IntersectController>(IntersectController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get topics', () => {
    const topics = controller.topic();
    expect(topics.length).toBeGreaterThan(0);
    const topicsElement = topics[0];
    expect(topicsElement.identifiers).toBeDefined();
    expect(topicsElement.title).toBeDefined();
    expect(topicsElement.description).toBeDefined();
    expect(topicsElement.supports).toBeDefined();
    expect(Array.isArray(topicsElement.supports)).toBe(true);
  });
});
