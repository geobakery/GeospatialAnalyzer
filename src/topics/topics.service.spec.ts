import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('TopicsService', () => {
  let service: TopicsService;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicsService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    mod = module;
  });

  afterEach(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
