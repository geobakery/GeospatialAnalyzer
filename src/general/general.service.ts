import { GeoJSON, Geometry } from 'typeorm';
import { DBResponse, ErrorResponse } from './general.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

@Injectable()
export class GeneralService {
  dbToGeoJSON(response: DBResponse[]): GeoJSON[] | ErrorResponse {
    if (response.length) {
      return response.map((r) => r.response);
    } else {
      throw new HttpException(
        'Unexpected formate error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  getGeometryTypeGeoJSON(geometry: Geometry): string {
    return geometry.type;
  }
  getPointCoordinatesGeoJSON(geometry: Geometry): string {
    return geometry.type;
  }
}
