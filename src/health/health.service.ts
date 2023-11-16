import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth(): any {
    const healthcheck = {
      api: 'ok',
      timestamp: Date.now(),
    };
    return healthcheck;
  }
}
