import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { IntersectModule } from './intersect/intersect.module';
import { TransformModule } from './transform/transform.module';
import { ValuesAtPointModule } from './values-at-point/values-at-point.module';
import { GeneralModule } from './general/general.module';
import { WithinModule } from './within/within.module';
import { HealthModule } from './health/health.module';
import { NearestNeighbourModule } from './nearest-neighbour/nearest-neighbour.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.dev', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: process.env.geospatial_analyzer_db_type,
      host: process.env.geospatial_analyzer_db_host,
      port: process.env.geospatial_analyzer_db_port,
      username: process.env.geospatial_analyzer_db_username,
      password: process.env.geospatial_analyzer_db_password,
      database: process.env.geospatial_analyzer_db_database,
      connectTimeoutMS: process.env.geospatial_analyzer_connectTimeoutMS
        ? Number(process.env.geospatial_analyzer_connectTimeoutMS)
        : 60000,
      synchronize: JSON.parse(process.env.geospatial_analyzer_db_synchronize),
      logging: JSON.parse(process.env.geospatial_analyzer_db_logging),
      subscribers: [],
      migrations: [],
      extra: {
        statement_timeout: process.env.statement_timeout
          ? Number(process.env.geospatial_analyzer_statement_timeout)
          : 30000, // number of milliseconds before a statement in query will time out, default is no timeout
        query_timeout: process.env.geospatial_analyzer_query_timeout
          ? Number(process.env.geospatial_analyzer_query_timeout)
          : 30000, // number of milliseconds before a query call will timeout, default is no timeout
        connectionTimeoutMillis: process.env
          .geospatial_analyzer_connectionTimeoutMillis
          ? Number(process.env.geospatial_analyzer_connectionTimeoutMillis)
          : 0, // number of milliseconds to wait for connection, default is no timeout
        idle_in_transaction_session_timeout: process.env
          .geospatial_analyzer_idle_in_transaction_session_timeout
          ? Number(
              process.env
                .geospatial_analyzer_idle_in_transaction_session_timeout,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
