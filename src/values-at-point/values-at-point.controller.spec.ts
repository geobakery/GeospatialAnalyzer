
import { Test, TestingModule } from '@nestjs/testing';

import { createUnitTestModules } from '../../test/helpers/database.helper';
import { GeneralModule } from '../general/general.module';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';

describe('ValuesAtPointController', () => {
  let controller: ValuesAtPointController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
      providers: [ValuesAtPointService],
    }).compile();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<ValuesAtPointController>(ValuesAtPointController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

