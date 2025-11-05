import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtPointService } from './values-at-point.service';


import { createUnitTestModules } from '../../test/helpers/database.helper';
import { GeneralModule } from '../general/general.module';

describe('ValuesAtPointService', () => {
  let service: ValuesAtPointService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValuesAtPointService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<ValuesAtPointService>(ValuesAtPointService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

