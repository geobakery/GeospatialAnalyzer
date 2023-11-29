import { Test, TestingModule } from '@nestjs/testing';
import { WithinService } from './within.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../general/general.module';

describe('WithinService', () => {
  let service: WithinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithinService],
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
        GeneralModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<WithinService>(WithinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
