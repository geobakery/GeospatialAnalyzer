import { Test, TestingModule } from '@nestjs/testing';
import { IntersectService } from './intersect.service';
import { GeneralModule } from '../general/general.module';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('IntersectService', () => {
  let service: IntersectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntersectService],
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
    service = module.get<IntersectService>(IntersectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
