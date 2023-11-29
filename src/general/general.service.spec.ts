import { Test, TestingModule } from '@nestjs/testing';
import { GeneralService } from './general.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { STANDARD_CRS } from './general.constants';
import { Geometry } from 'typeorm';

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralService],
      imports: [
        TypeOrmModule.forRoot({
          type: process.env.db_postgres_type,
          host: process.env.db_postgres_host,
          port: process.env.db_postgres_port,
          username: process.env.db_postgres_username,
          password: process.env.db_postgres_password,
          database: process.env.db_postgres_database,
          synchronize: JSON.parse(process.env.db_postgres_synchronize),
          logging: JSON.parse(process.env.db_postgres_logging),
        } as TypeOrmModule),
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
  it('should show correct crs', () => {
    const result = service.getCoordinateSystem({});
    expect(result).toBe(STANDARD_CRS);
  });

  // example mock function
  // We can adjust the output of a service by mocking it. If this service is called by itself or another function
  // our mocked version will always be executed (In this case it returns 1234, even the real version would return 4326)
  it('should work with mock', () => {
    const mockResult = 1234;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    jest
      .spyOn(service, 'getCoordinateSystem')
      .mockImplementation(({}) => mockResult);

    const result = service.getCoordinateSystem({
      type: 'Point',
      coordinates: [0, 1],
    } as Geometry);
    expect(result).toBe(1234);
  });
});
