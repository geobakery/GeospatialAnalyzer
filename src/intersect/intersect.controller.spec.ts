import { Test, TestingModule } from '@nestjs/testing';
import { IntersectController } from './intersect.controller';

describe('IntersectController', () => {
  let controller: IntersectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntersectController],
    }).compile();

    controller = module.get<IntersectController>(IntersectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
