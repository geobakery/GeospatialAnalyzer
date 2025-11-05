import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { WithinController } from './within.controller';
import { WithinService } from './within.service';
import { GeneralModule } from '../general/general.module';


import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('WithinController', () => {
  let controller: WithinController;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithinController],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
      providers: [WithinService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<WithinController>(WithinController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

