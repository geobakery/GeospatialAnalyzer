import { Test, TestingModule } from '@nestjs/testing';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';

describe('TopicsService', () => {
  let service: TopicsService;
  let mod: TestingModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TopicsService],
      imports: [...createUnitTestModules(), GeneralModule],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    mod = module;
  });

  afterEach(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('exposes attribution as a de-duplicated list for multi-source topics', () => {
    const topics = service.getTopics();
    const heights = topics.find((t) => t.identifiers.includes('hoehe_r'));
    expect(heights).toBeDefined();
    expect(heights?.attribution).toHaveLength(2);
    expect(heights?.attribution?.[0].name).toBe('GeoSN');
    expect(heights?.attribution?.[0].url).toContain('a3dba5b2');
    expect(heights?.attribution?.[1].name).toBe('GeoSN');
    expect(heights?.attribution?.[1].url).toContain('587d9a32');
  });

  it('exposes valueMetadata on topics that configure it', () => {
    const topics = service.getTopics();
    const heights = topics.find((t) => t.identifiers.includes('hoehe_r'));
    expect(heights?.valueMetadata).toEqual({
      unit: 'cm',
      verticalDatum: 'DHHN2016',
    });
  });

  it('omits attribution and valueMetadata on topics without configuration', () => {
    const topics = service.getTopics();
    const land = topics.find((t) => t.identifiers.includes('land_f'));
    expect(land).toBeDefined();
    expect(land?.attribution).toBeUndefined();
    expect(land?.valueMetadata).toBeUndefined();
  });
});
