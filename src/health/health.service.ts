import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ErrorResponse, GeneralResponse } from '../general/general.interface';

@Injectable()
export class HealthService {
  constructor(private dataSource: DataSource) {}

  async getCurrentHealth(): Promise<GeneralResponse | ErrorResponse> {
    const databaseResult = await this.dataSource.query('SELECT 1');
    if (databaseResult) {
      return { response: 'ok' } as GeneralResponse;
    }
    throw new HttpException(
      'Database not reachable',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
