import { Test, TestingModule } from '@nestjs/testing';
import { GeneralService } from './general.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { STANDARD_CRS } from './general.constants';

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  beforeEach(async () => {
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

  it('test crs', () => {
    const result = service.getCoordinateSystem({});
    expect(result).toBe(STANDARD_CRS);
  });
});
