import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GeneralService } from '../general/general.service';
import {
  dbRequestBuilderSample,
  ErrorResponse,
  GeneralResponse,
} from '../general/general.interface';

const HEALTH_CALL = 'SELECT 1';
@Injectable()
export class HealthService {
  constructor(private generalService: GeneralService) {}

  async getCurrentHealth(): Promise<GeneralResponse | ErrorResponse> {
    const dbBuilderParameter: dbRequestBuilderSample = {
      select: false,
      customStatement: true,
      where: false,
      selectStatement: HEALTH_CALL,
    };
    const databaseResult =
      await this.generalService.executePlainDatabaseQuery(dbBuilderParameter);
    if (databaseResult) {
      return { response: 'ok' } as GeneralResponse;
    }
    throw new HttpException(
      'Database not reachable',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
