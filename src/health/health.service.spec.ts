import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('HealthService', () => {
  let service: HealthService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
      ],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<HealthService>(HealthService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
