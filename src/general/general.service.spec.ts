import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { GeneralService } from './general.service';
import { topicDefinition } from './general.interface';
import { ConfigModule, ConfigService } from '@nestjs/config';

const TOPIC_CONFIG_EXAMPLE: topicDefinition[] = [
  {
    "identifiers": ["topicA"],
    "title": "First Topic",
    "description": "Description of the first topic",
    "__source__": { "name": "unused", "source": "schemaA.tableA", "srid": 4326 },
    "__attributes__": ["id", "title", "geom"],
    "__supports__": ["intersect", "within"],
    "__filterGroups__": ["topicGroupOne","topicGroupTwo"],
  },
  {
    "identifiers": ["topicB"],
    "title": "Second Topic",
    "description": "Description of the second topic",
    "__source__": { "name": "unused", "source": "schemaB.tableB", "srid": 4326 },
    "__attributes__": ["id", "title", "adress", "description"],
    "__supports__": ["nearestNeighbour", "valuesAtPoint"],
    "__filterGroups__": ["topicGroupThree","topicGroupTwo"],
  },
  {
    "identifiers": ["topicC"],
    "title": "Third Topic",
    "description": "Description of the third topic",
    "__source__": { "name": "unused", "source": "schemaC.tableC", "srid": 4326 },
    "__attributes__": ["id", "title", "adress", "description"],
    "__supports__": ["nearestNeighbour", "intersect"],
    "__filterGroups__": ["topicGroupTwo"],
  },
]

describe('GeneralService', () => {
  let service: GeneralService;
  let mod: TestingModule;

  async function setup(topicGroupFilterString?: string) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GeneralService],
      imports: [
        ConfigModule.forRoot({
            envFilePath: ['.env.test', '.env'],
            load: [() => (
              {
                "__topicsConfig__": TOPIC_CONFIG_EXAMPLE,
                "GEOSPATIAL_ANALYZER_TOPIC_GROUP_FILTER": topicGroupFilterString,
               })],
            isGlobal: true,
          }),
        TransformModule,
      ],
    }).compile();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    service = module.get<GeneralService>(GeneralService);
    mod = module;
  };
  
  describe('with default setup', () => {
    beforeAll(async () => await setup());
    afterAll(async () => await mod.close());

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
      expect(result).toEqual(['test']);
    });
  });

  describe('with empty topic group filtering', () => {
    beforeAll(async () => await setup(''));
    afterAll(async () => await mod.close());

    it('should return all configured topics', () => {
      const result = service.getTopics();
      expect(result).toEqual(['topicA', 'topicB', 'topicC']);
    });
  })

  describe('with different topic group sets selected for filtering', () => {
    describe('groupOne and groupThree', () => {
      beforeAll(async () => await setup('topicGroupOne, topicGroupThree'));
      afterAll(async () => await mod.close());   

      it('should return topics A and B', () => {
        const result = service.getTopics();
        expect(result).toEqual(['topicA', 'topicB']);
      });
    });

    describe('groupThree with leading whitespace', () => {
      beforeAll(async () => await setup(' topicGroupThree'));
      afterAll(async () => await mod.close());

      it('should return topics B', () => {
        const result = service.getTopics();
        expect(result).toEqual(['topicB']);
      });
    })
  })
});
