import { GeoJSON } from 'typeorm';
import { DBResponse, ErrorResponse } from './general.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GeneralService {
  dbToGeoJSON(response: DBResponse[]): GeoJSON | ErrorResponse {
    if (response.length === 1) {
      return response[0].response;
    } else {
      return this.errorResponse(500, 'No FeatureCollection found');
    }
  }
  errorResponse(status, message): ErrorResponse {
    return {
      status: status,
      error: message,
    };
  }
}
