import { Test, TestingModule } from '@nestjs/testing';
import { WithinController } from './within.controller';

describe('WithinController', () => {
  let controller: WithinController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithinController],
    }).compile();

    controller = module.get<WithinController>(WithinController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
