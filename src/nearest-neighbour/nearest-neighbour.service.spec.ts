import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransformModule } from '../transform/transform.module';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { GeneralModule } from '../general/general.module';
import { createUnitTestModules } from '../../test/helpers/database.helper';
import { PostgresService } from '../general/adapter/postgres.service';
import { NearestNeighbourParameterDto } from '../general/dto/parameter.dto';

describe('NearestNeighbourService', () => {
  let service: NearestNeighbourService;
  let mod: TestingModule;

  const check = (min: number | undefined, max: number) =>
    service['assertValidDistanceRange']({
      minDistanceToNeighbour: min,
      maxDistanceToNeighbour: max,
    } as NearestNeighbourParameterDto);

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

  it('rejects a minimum above the maximum', () => {
    expect(() => check(10, 5)).toThrow(BadRequestException);
  });
  it('treats a maximum of 0 as no maximum', () => {
    expect(() => check(10, 0)).not.toThrow();
  });
  it('treats a missing minimum as 0', () => {
    expect(() => check(undefined, 5)).not.toThrow();
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
