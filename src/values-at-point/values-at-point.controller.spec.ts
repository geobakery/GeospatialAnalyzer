import { Test, TestingModule } from '@nestjs/testing';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';

describe('ValuesAtPointController', () => {
  let controller: ValuesAtPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ValuesAtPointController],
      providers: [ValuesAtPointService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<ValuesAtPointController>(ValuesAtPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
