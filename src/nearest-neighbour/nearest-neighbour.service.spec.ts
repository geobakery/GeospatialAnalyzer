import { Test, TestingModule } from '@nestjs/testing';
import { TransformModule } from '../transform/transform.module';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';
import { PostgresService } from '../general/adapter/postgres.service';

describe('NearestNeighbourService', () => {
  let service: NearestNeighbourService;
  let mod: TestingModule;

  const polygon = { raw: true as const, value: 'POLY' };
  const other = { raw: true as const, value: 'geom' };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NearestNeighbourService],
      imports: [...createUnitTestModules(), GeneralModule, TransformModule],
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

  it('hasNoPartInside uses the FF******* pattern', () => {
    expect(new PostgresService().hasNoPartInside(polygon, other)).toBe(
      "ST_Relate(POLY, geom, 'FF*******')",
    );
  });

  it('isNotEntirelyInside combines the three patterns with OR', () => {
    const sql = new PostgresService().isNotEntirelyInside(polygon, other);
    expect(sql).toContain("'FF*******'");
    expect(sql).toContain("'******T**'");
    expect(sql).toContain("'*******T*'");
    expect(sql.match(/\bOR\b/g)).toHaveLength(2);
  });
});
