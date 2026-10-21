import { Test, TestingModule } from '@nestjs/testing';

import { createUnitTestModules } from '../../test/helpers/database.helper';
import { GeneralModule } from '../general/general.module';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtGridController } from './values-at-grid.controller';
import { ValuesAtGridService } from './values-at-grid.service';

describe('ValuesAtGridController', () => {
  let controller: ValuesAtGridController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtGridController],
      imports: [...createUnitTestModules(), GeneralModule, TransformModule],
      providers: [ValuesAtGridService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<ValuesAtGridController>(ValuesAtGridController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
