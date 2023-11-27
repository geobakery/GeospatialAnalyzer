import { Test, TestingModule } from '@nestjs/testing';
import { TransformService } from './transform.service';

describe('TransformService', () => {
  let service: TransformService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransformService],
    }).compile();

    service = module.get<TransformService>(TransformService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
