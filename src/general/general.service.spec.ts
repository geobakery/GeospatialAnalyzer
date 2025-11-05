import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';
import { GeneralService } from './general.service';

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralService],
      imports: [
        ...createUnitTestModules(),
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<GeneralService>(GeneralService);
    mod = module;
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // example test specific function
  it('should show topics array', () => {
    const result = service.getTopics();
    expect(result).toBeDefined();
  });

  // example mock function
  // We can adjust the output of a service by mocking it. If this service is called by itself or another function
  // our mocked version will always be executed (In this case it returns 1234, even the real version would return 4326)
  it('should work with mock', () => {
    const mockResult = ['test'];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    jest.spyOn(service, 'getTopics').mockImplementation(() => mockResult);

    const result = service.getTopics();
    expect(result).toEqual(expect.arrayContaining(['test']));
  });
});
