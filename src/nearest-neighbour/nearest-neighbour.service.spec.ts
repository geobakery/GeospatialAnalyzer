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

  const checkValidDistanceRange = (min: number | undefined, max: number) =>
    service['assertValidDistanceRange']({
      minDistanceToNeighbour: min,
      maxDistanceToNeighbour: max,
    } as NearestNeighbourParameterDto);

  const checkExclusionMinDistance = (
    extra: Partial<NearestNeighbourParameterDto>,
  ) =>
    service['assertNoPolygonExclusionWithMinDistance'](
      extra as NearestNeighbourParameterDto,
    );

  const checkExclusionExclusion = (
    extra: Partial<NearestNeighbourParameterDto>,
  ) =>
    service['hasAtMostOnePolygonExclusion'](
      extra as NearestNeighbourParameterDto,
    );

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
    expect(() => checkValidDistanceRange(10, 5)).toThrow(BadRequestException);
  });
  it('treats a maximum of 0 as no maximum', () => {
    expect(() => checkValidDistanceRange(10, 0)).not.toThrow();
  });
  it('treats a missing minimum as 0', () => {
    expect(() => checkValidDistanceRange(undefined, 5)).not.toThrow();
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

  it('rejects polygonExcludesInnerFeatures with a minimum above 0', () => {
    expect(() =>
      checkExclusionMinDistance({
        minDistanceToNeighbour: 1,
        polygonExcludesInnerFeatures: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects polygonExcludesEntirelyInnerFeatures with a minimum above 0', () => {
    expect(() =>
      checkExclusionMinDistance({
        minDistanceToNeighbour: 1,
        polygonExcludesEntirelyInnerFeatures: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts an exclusion option with a minimum of 0', () => {
    expect(() =>
      checkExclusionMinDistance({
        minDistanceToNeighbour: 0,
        polygonExcludesInnerFeatures: true,
      }),
    ).not.toThrow();
  });

  it('accepts an exclusion option without a minimum', () => {
    expect(() =>
      checkExclusionMinDistance({ polygonExcludesInnerFeatures: true }),
    ).not.toThrow();
  });

  it('accepts a minimum above 0 without exclusion options', () => {
    expect(() =>
      checkExclusionMinDistance({ minDistanceToNeighbour: 5 }),
    ).not.toThrow();
  });

  it('rejects both polygon exclusion options when used together', () => {
    expect(() =>
      checkExclusionExclusion({
        polygonExcludesInnerFeatures: true,
        polygonExcludesEntirelyInnerFeatures: true,
      }),
    ).toThrow(BadRequestException);
  });

  it('accepts polygonExcludesInnerFeatures without the other exclusion option', () => {
    expect(() =>
      checkExclusionExclusion({ polygonExcludesInnerFeatures: true }),
    ).not.toThrow();
  });

  it('accepts polygonExcludesEntirelyInnerFeatures without the other exclusion option', () => {
    expect(() =>
      checkExclusionExclusion({ polygonExcludesEntirelyInnerFeatures: true }),
    ).not.toThrow();
  });
});
