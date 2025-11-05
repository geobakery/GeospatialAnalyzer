import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('NearestNeighbourService', () => {
  let service: NearestNeighbourService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NearestNeighbourService],
      imports: [
        ...createUnitTestModules(),
        GeneralModule,
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<NearestNeighbourService>(NearestNeighbourService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
