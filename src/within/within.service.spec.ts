import { Test, TestingModule } from '@nestjs/testing';
import { WithinService } from './within.service';

describe('WithinService', () => {
  let service: WithinService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithinService],
    }).compile();

    service = module.get<WithinService>(WithinService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
