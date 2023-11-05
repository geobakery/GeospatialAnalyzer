import { Injectable } from '@nestjs/common';
import { GeoJSON } from 'typeorm';

@Injectable()
export class IntersectService {
  getTopics(): string[] {
    return [''];
  }

  calculateIntersect(): GeoJSON {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [125.6, 10.1],
      },
      properties: {
        name: 'Dinagat Islands',
      },
    };
  }
}
