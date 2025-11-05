import { Test, TestingModule } from '@nestjs/testing';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('TopicsController', () => {
  let controller: TopicsController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TopicsController],
      providers: [TopicsService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
      ],
    }).compile();

    controller = module.get<TopicsController>(TopicsController);
    mod = module;
  });

  afterEach(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
