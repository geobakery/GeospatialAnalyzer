import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { WithinService } from './within.service';
import { GeneralModule } from '../general/general.module';


import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('WithinService', () => {
  let service: WithinService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithinService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<WithinService>(WithinService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

