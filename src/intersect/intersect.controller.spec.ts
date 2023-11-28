import { Test, TestingModule } from '@nestjs/testing';
import { IntersectController } from './intersect.controller';
import { GeneralModule } from '../general/general.module';
import { IntersectService } from './intersect.service';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('IntersectController', () => {
  let controller: IntersectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
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
      providers: [IntersectService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<IntersectController>(IntersectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
