import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SpatialRefereranceDto } from './spatial-refererance.dto';

/**
 * @see https://developers.arcgis.com/documentation/common-data-types/feature-object.htm
 * @see https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm
 * @TODO: We should update the OpenAPI specification of this. However, the geometry objects docs linked above are not
 *        the clearest. For example, `x` and `y` are defined as mandatory for point geometries, but in the "Empty points"
 *        examples sometimes `y` is missing.
 */
@ApiExtraModels(SpatialRefereranceDto)
export class EsriGeometryDto {
  @ApiProperty({ required: false })
  x?: number;

  @ApiProperty({ required: false })
  y?: number;

  @ApiProperty({ required: false })
  z?: number;

  @ApiProperty({ required: false })
  m?: number;

  @ApiProperty({ required: false })
  paths?: number[];

  @ApiProperty({ required: false })
  rings?: number[];

  @ApiProperty({ required: false })
  points?: number[];

  @ApiProperty()
  @Type(() => SpatialRefereranceDto)
  spatialReference: SpatialRefereranceDto;
}
