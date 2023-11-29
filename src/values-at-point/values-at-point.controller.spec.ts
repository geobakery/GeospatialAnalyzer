import { Test, TestingModule } from '@nestjs/testing';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';

describe('ValuesAtPointController', () => {
  let controller: ValuesAtPointController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
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
