import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { GeneralModule } from './general/general.module';
import { HealthModule } from './health/health.module';
import { IntersectModule } from './intersect/intersect.module';
import { MetricsModule } from './metrics/metrics.module';
import { NearestNeighbourModule } from './nearest-neighbour/nearest-neighbour.module';
import { TransformModule } from './transform/transform.module';
import { ValuesAtPointModule } from './values-at-point/values-at-point.module';
import { WithinModule } from './within/within.module';
import { TopicsModule } from './topics/topics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: process.env.GEOSPATIAL_ANALYZER_DB_TYPE,
      host: process.env.GEOSPATIAL_ANALYZER_DB_HOST,
      port: process.env.GEOSPATIAL_ANALYZER_DB_PORT,
      username: process.env.GEOSPATIAL_ANALYZER_DB_USERNAME,
      password: process.env.GEOSPATIAL_ANALYZER_DB_PASSWORD,
      database: process.env.GEOSPATIAL_ANALYZER_DB_DATABASE,
      connectTimeoutMS: process.env.GEOSPATIAL_ANALYZER_CONNECT_TIMEOUT_MS
        ? Number(process.env.GEOSPATIAL_ANALYZER_CONNECT_TIMEOUT_MS)
        : 60000,
      //use JSON.parse to ensure boolean expressions
      synchronize: JSON.parse(process.env.GEOSPATIAL_ANALYZER_DB_SYNCHRONIZE),
      logging: JSON.parse(process.env.GEOSPATIAL_ANALYZER_DB_LOGGING),
      subscribers: [],
      migrations: [],
      extra: {
        statement_timeout: process.env.statement_timeout
          ? Number(process.env.GEOSPATIAL_ANALYZER_STATEMENT_TIMEOUT_MS)
          : 30000, // number of milliseconds before a statement in query will time out, default is no timeout
        query_timeout: process.env.GEOSPATIAL_ANALYZER_QUERY_TIMEOUT_MS
          ? Number(process.env.GEOSPATIAL_ANALYZER_QUERY_TIMEOUT_MS)
          : 30000, // number of milliseconds before a query call will timeout, default is no timeout
        connectionTimeoutMillis: process.env
          .GEOSPATIAL_ANALYZER_CONNECTION_TIMEOUT_MS
          ? Number(process.env.GEOSPATIAL_ANALYZER_CONNECTION_TIMEOUT_MS)
          : 0, // number of milliseconds to wait for connection, default is no timeout
        idle_in_transaction_session_timeout: process.env
          .GEOSPATIAL_ANALYZER_IDLE_IN_TRANSACTION_SESSION_TIMOUT
          ? Number(
              process.env
                .GEOSPATIAL_ANALYZER_IDLE_IN_TRANSACTION_SESSION_TIMOUT,
            )
          : 0, // number of milliseconds before terminating any session with an open idle transaction, default is no timeout
      },
    } as TypeOrmModule),
    IntersectModule,
    TransformModule,
    ValuesAtPointModule,
    GeneralModule,
    WithinModule,
    HealthModule,
    NearestNeighbourModule,
    TopicsModule,
    MetricsModule,
  ],
})
export class AppModule {}
