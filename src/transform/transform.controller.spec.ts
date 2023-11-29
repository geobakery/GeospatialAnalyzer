import { Test, TestingModule } from '@nestjs/testing';
import { TransformController } from './transform.controller';
import { TransformService } from './transform.service';

describe('TransformController', () => {
  let controller: TransformController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransformController],
      providers: [TransformService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<TransformController>(TransformController);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
