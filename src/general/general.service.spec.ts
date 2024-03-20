import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../config/configuration';
import { TransformModule } from '../transform/transform.module';
import { GeneralService } from './general.service';

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
