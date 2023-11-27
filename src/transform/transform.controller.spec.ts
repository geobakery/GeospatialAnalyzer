import { Test, TestingModule } from '@nestjs/testing';
import { TransformController } from './transform.controller';

describe('TransformController', () => {
  let controller: TransformController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransformController],
    }).compile();

    controller = module.get<TransformController>(TransformController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
