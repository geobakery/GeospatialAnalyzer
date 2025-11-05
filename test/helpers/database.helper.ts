import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { createTestConfigModule } from './test-configuration.helper';

/**
 * Test-specific database configuration options
 */
interface TestDbOptions {
  /** Additional timeout settings for test environments */
  connectTimeoutMS?: number;
  /** Statement timeout for test queries */
  statementTimeout?: number;
  /** Query timeout for test operations */
  queryTimeout?: number;
  /** Connection timeout in milliseconds */
  connectionTimeoutMillis?: number;
  /** Idle transaction timeout */
  idleInTransactionSessionTimeout?: number;
}

/**
 * Default timeout configuration for test databases
 */
const DEFAULT_TEST_DB_OPTIONS: Required<TestDbOptions> = {
  connectTimeoutMS: 10000,
  statementTimeout: 10000,
  queryTimeout: 10000,
  connectionTimeoutMillis: 5000,
  idleInTransactionSessionTimeout: 5000,
};

/**
 * Creates TypeORM configuration for any test environment (unit or e2e)
 * Uses the same database connection approach as the main application
 * 
 * @param entities Array of TypeORM entities to register
 * @param options Optional database configuration overrides for testing
 */
export function createTestDbConfig(entities: any[] = [], options: TestDbOptions = {}) {
  const dbOptions = { ...DEFAULT_TEST_DB_OPTIONS, ...options };
  
  return TypeOrmModule.forRootAsync({
    imports: [createTestConfigModule()],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      type: configService.get('GEOSPATIAL_ANALYZER_DB_TYPE'),
      host: configService.get('GEOSPATIAL_ANALYZER_DB_HOST'),
      port: configService.get('GEOSPATIAL_ANALYZER_DB_PORT'),
      username: configService.get('GEOSPATIAL_ANALYZER_DB_USERNAME'),
      password: configService.get('GEOSPATIAL_ANALYZER_DB_PASSWORD'),
      database: configService.get('GEOSPATIAL_ANALYZER_DB_DATABASE'),
      entities,
      connectTimeoutMS: dbOptions.connectTimeoutMS,
      synchronize: false,
      logging: false,
      extra: {
        statement_timeout: dbOptions.statementTimeout,
        query_timeout: dbOptions.queryTimeout,
        connectionTimeoutMillis: dbOptions.connectionTimeoutMillis,
        idle_in_transaction_session_timeout: dbOptions.idleInTransactionSessionTimeout,
      },
    } as any),
  });
}

/**
 * Creates both database and config modules for test environments
 * This is the primary function to use in most test scenarios
 * 
 * @param entities Array of TypeORM entities to register
 * @param options Optional database configuration overrides for testing
 */
export function createTestModules(entities: any[] = [], options: TestDbOptions = {}) {
  return [
    createTestDbConfig(entities, options),
    createTestConfigModule(),
  ];
}

/**
 * Convenience function specifically for unit tests
 * Uses slightly more aggressive timeouts suitable for unit testing
 */
export function createUnitTestModules(entities: any[] = []) {
  return createTestModules(entities, {
    connectTimeoutMS: 8000,
    statementTimeout: 8000,
    queryTimeout: 8000,
    connectionTimeoutMillis: 3000,
    idleInTransactionSessionTimeout: 3000,
  });
}

/**
 * Convenience function specifically for e2e tests
 * Uses more conservative timeouts suitable for integration testing
 */
export function createE2eTestModules(entities: any[] = []) {
  return createTestModules(entities, {
    connectTimeoutMS: 15000,
    statementTimeout: 15000,
    queryTimeout: 15000,
    connectionTimeoutMillis: 8000,
    idleInTransactionSessionTimeout: 8000,
  });
}