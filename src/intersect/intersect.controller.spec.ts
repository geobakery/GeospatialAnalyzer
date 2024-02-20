import { Test, TestingModule } from '@nestjs/testing';
import { IntersectController } from './intersect.controller';
import { GeneralModule } from '../general/general.module';
import { IntersectService } from './intersect.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { async } from 'rxjs';
import { GeoJSON } from 'typeorm';

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
    expect(topicsElement.identifier).toBeDefined();
    expect(topicsElement.title).toBeDefined();
    expect(topicsElement.description).toBeDefined();
    expect(topicsElement.supports).toBeUndefined();
  });

  it('should get response', async () => {
    const result = await controller.intersect({
      inputGeometries: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [13.75, 51.07],
          },
          properties: {
            name: 'test1',
            __geometryIdentifier__: 'meine ID',
          },
        },
      ],
      topics: ['verw_kreis_f'],
      timeout: 60000,
      returnGeometry: false,
      outputFormat: 'geojson',
      count: 0,
      maxDistanceToNeighbour: 0,
      outSRS: '4326',
    });
    expect(result).toBeDefined();
    expect(result as GeoJSON[]).toBeDefined();
    const geojsonArray = result as GeoJSON[];
    expect(geojsonArray.length).toBeGreaterThan(0);
    const geojson = geojsonArray[0];
    expect(geojson.type === 'Feature').toBe(true);
  });
});
