import { Test, TestingModule } from '@nestjs/testing';
import { GeneralService } from './general.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Geometry } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { TransformModule } from '../transform/transform.module';
import { GeneralModule } from './general.module';
import { HttpException } from '@nestjs/common';

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralService],
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
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<GeneralService>(GeneralService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // example test specific function
  it('should show topics array', () => {
    const result = service.getTopics();
    expect(result).toBeDefined();
  });

  it('check sql injection', () => {
    expect(service.injectionCheck('DROP ALL TABLES;')).rejects.toThrowError(
      HttpException,
    );

    expect(
      service.injectionCheck('... SELECT * FROM ALL TABLES;'),
    ).rejects.toThrowError(HttpException);

    expect(
      service.injectionCheck('... DELETE * FROM ...;'),
    ).rejects.toThrowError(HttpException);

    expect(service.injectionCheck('... UPDATE ...;')).rejects.toThrowError(
      HttpException,
    );

    expect(service.injectionCheck('... TRUNCATE ...;')).rejects.toThrowError(
      HttpException,
    );

    expect(service.injectionCheck('INSERT xxx')).rejects.toThrowError(
      HttpException,
    );

    expect(service.injectionCheck(' --SELECT all')).rejects.toThrowError(
      HttpException,
    );

    expect(
      service.injectionCheck(' <iframe>XXX</iframe>'),
    ).rejects.toThrowError(HttpException);
  });

  it('check sql injection is not triggerd', () => {
    expect(
      service.injectionCheck('SELECT a,b FROM Table'),
    ).resolves.not.toThrowError(HttpException);

    expect(
      service.injectionCheck(
        " (SELECT '__ID_0' as id, 'xxx_xxx_f' as topic,  json_build_object(\n" +
          "'type', 'FeatureCollection',\n" +
          "'features', json_agg(ST_AsGeoJSON(customFromSelect.*)::jsonb - 'geometry')\n" +
          ") as response FROM (SELECT geom,name,'xxx_xxx_f' as __topic FROM spatialyzer_demo.xxx_xxx_f) AS " +
          "customFromSelect WHERE ST_WITHIN (ST_Transform('SRID=4326;POINT (13.75 51.07)'::geometry, 25833)," +
          'customFromSelect.geom) )\n' +
          '\n',
      ),
    ).resolves.not.toThrowError(HttpException);
  });

  // example mock function
  // We can adjust the output of a service by mocking it. If this service is called by itself or another function
  // our mocked version will always be executed (In this case it returns 1234, even the real version would return 4326)
  it('should work with mock', () => {
    const mockResult = ['test'];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    jest.spyOn(service, 'getTopics').mockImplementation(() => mockResult);

    const result = service.getTopics();
    expect(result).toEqual(expect.arrayContaining(['test']));
  });
});
