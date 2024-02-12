import { Test, TestingModule } from '@nestjs/testing';
import { WithinService } from './within.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../general/general.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';

describe('WithinService', () => {
  let service: WithinService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithinService],
      imports: [
        TypeOrmModule.forRoot({
          type: process.env.db_postgres_type,
          host: 'localhost',
          port: process.env.db_postgres_port,
          username: process.env.db_postgres_username,
          password: process.env.db_postgres_password,
          database: process.env.db_postgres_database,
          synchronize: JSON.parse(process.env.db_postgres_synchronize),
          logging: JSON.parse(process.env.db_postgres_logging),
        } as TypeOrmModule),
        ConfigModule.forRoot({
          envFilePath: ['.env.dev', '.env'],
          load: [configuration],
          isGlobal: true,
        }),
        GeneralModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<WithinService>(WithinService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
