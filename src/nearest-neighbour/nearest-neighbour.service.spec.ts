import { Test, TestingModule } from '@nestjs/testing';
import { NearestNeighbourService } from './nearest-neighbour.service';

describe('NearestNeighbourService', () => {
  let service: NearestNeighbourService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NearestNeighbourService],
    }).compile();

    service = module.get<NearestNeighbourService>(NearestNeighbourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
