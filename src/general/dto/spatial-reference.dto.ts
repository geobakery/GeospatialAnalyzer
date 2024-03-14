import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpatialReferenceDto {
  @ApiProperty({
    example: 102100,
  })
  wkid: number;

  @ApiPropertyOptional({
    description:
      'From https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm:\n' +
      'The well-known ID (WKID) for a given spatial reference can occasionally change. ' +
      'For example, the WGS 1984 Web Mercator (Auxiliary Sphere) projection was originally assigned WKID 102100 but was later changed to 3857. ' +
      'To ensure backward compatibility with older spatial data servers, the JSON wkid property will always be the value that was originally assigned to an SR when it was created.\n' +
      '\n' +
      'An additional property, latestWkid, identifies the current WKID value (as of a given software release) associated with the same spatial reference.',
    example: 3857,
  })
  latestWkid?: number;
}
