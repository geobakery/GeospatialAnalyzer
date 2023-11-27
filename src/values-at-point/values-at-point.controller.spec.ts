import { Test, TestingModule } from '@nestjs/testing';
import { ValuesAtPointController } from './values-at-point.controller';

describe('ValuesAtPointController', () => {
  let controller: ValuesAtPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
    }).compile();

    controller = module.get<ValuesAtPointController>(ValuesAtPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
