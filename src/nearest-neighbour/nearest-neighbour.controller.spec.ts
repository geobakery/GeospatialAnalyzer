import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { NearestNeighbourController } from './nearest-neighbour.controller';
import { GeneralModule } from '../general/general.module';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('NearestNeighbourController', () => {
  let controller: NearestNeighbourController;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NearestNeighbourController],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
      providers: [NearestNeighbourService],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    controller = module.get<NearestNeighbourController>(
      NearestNeighbourController,
    );
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
