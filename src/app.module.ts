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
      type: process.env.db_postgres_type,
      host: process.env.db_postgres_host,
      port: process.env.db_postgres_port,
      username: process.env.db_postgres_username,
      password: process.env.db_postgres_password,
      database: process.env.db_postgres_database,
      connectTimeoutMS: 10000,
      synchronize: JSON.parse(process.env.db_postgres_synchronize),
      logging: JSON.parse(process.env.db_postgres_logging),
      subscribers: [],
      migrations: [],
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
