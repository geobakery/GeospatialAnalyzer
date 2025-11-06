import { Injectable, Logger } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { MetricsService } from './metrics.service';

/**
 * Tracks database query execution for metrics by intercepting QueryBuilder methods
 */
@Injectable()
export class DatabaseMetricsTracker {
  private readonly logger = new Logger(DatabaseMetricsTracker.name);

  constructor(private readonly metricsService: MetricsService) {
    this.setupQueryTracking();
  }

  private setupQueryTracking() {
    this.logger.log('🚀 Setting up database query interception...');

    this.interceptQueryBuilderMethod('execute');
    this.interceptQueryBuilderMethod('getRawMany');
    this.interceptQueryBuilderMethod('getRawOne');
    this.interceptQueryBuilderMethod('getMany');
    this.interceptQueryBuilderMethod('getOne');
    this.interceptQueryBuilderMethod('getCount');

    this.logger.log('✅ Database query interception setup complete');
  }

  private interceptQueryBuilderMethod(methodName: string) {
    const originalMethod = (SelectQueryBuilder.prototype as any)[methodName];

    if (!originalMethod) {
      this.logger.warn(
        `⚠️  Method ${methodName} not found on SelectQueryBuilder`,
      );
      return;
    }

    const metricsService = this.metricsService;

    (SelectQueryBuilder.prototype as any)[methodName] = async function (
      ...args: any[]
    ) {
      const startTime = Date.now();

      let queryType = 'SELECT';
      try {
        const sql = this.getQuery();
        queryType = extractQueryType(sql);
      } catch (e) {
        queryType = 'SELECT';
      }

      try {
        const result = await originalMethod.apply(this, args);
        const duration = (Date.now() - startTime) / 1000;
        metricsService.recordDatabaseQuery(queryType, duration, 'success');
        return result;
      } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        metricsService.recordDatabaseQuery(queryType, duration, 'error');
        throw error;
      }
    };
  }
}

function extractQueryType(sql: string): string {
  if (!sql) return 'OTHER';

  const normalizedQuery = sql.trim().toUpperCase();
  //actually we only care about SELECT, but we keep this here for reference
  if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
  if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
  if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
  if (normalizedQuery.startsWith('DELETE')) return 'DELETE';
  if (normalizedQuery.startsWith('CREATE')) return 'CREATE';
  if (normalizedQuery.startsWith('DROP')) return 'DROP';
  if (normalizedQuery.startsWith('ALTER')) return 'ALTER';
  if (normalizedQuery.startsWith('BEGIN')) return 'BEGIN';
  if (normalizedQuery.startsWith('COMMIT')) return 'COMMIT';
  if (normalizedQuery.startsWith('ROLLBACK')) return 'ROLLBACK';
  if (normalizedQuery.startsWith('WITH')) return 'WITH';

  return 'OTHER';
}

