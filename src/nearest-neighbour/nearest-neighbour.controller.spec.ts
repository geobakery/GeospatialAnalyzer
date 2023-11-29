import { Test, TestingModule } from '@nestjs/testing';
import { NearestNeighbourController } from './nearest-neighbour.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralModule } from '../general/general.module';
import { NearestNeighbourService } from './nearest-neighbour.service';

describe('NearestNeighbourController', () => {
  let controller: NearestNeighbourController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
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
      providers: [NearestNeighbourService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<NearestNeighbourController>(
      NearestNeighbourController,
    );
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
