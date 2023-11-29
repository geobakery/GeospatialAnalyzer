import { Test, TestingModule } from '@nestjs/testing';
import { ValuesAtPointService } from './values-at-point.service';

describe('ValuesAtPointService', () => {
  let service: ValuesAtPointService;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValuesAtPointService],
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
