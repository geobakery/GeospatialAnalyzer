import { Test, TestingModule } from '@nestjs/testing';
import { NearestNeighbourController } from './nearest-neighbour.controller';

describe('NearestNeighbourController', () => {
  let controller: NearestNeighbourController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
    }).compile();

    controller = module.get<NearestNeighbourController>(NearestNeighbourController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
