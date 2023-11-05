import { Test, TestingModule } from '@nestjs/testing';
import { IntersectService } from './intersect.service';

describe('IntersectService', () => {
  let service: IntersectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntersectService],
    }).compile();

    service = module.get<IntersectService>(IntersectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
