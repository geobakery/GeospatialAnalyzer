import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { IntersectModule } from './intersect/intersect.module';
import { LandEntity } from './general/entities/land.entity';
import { GeneralModule } from './general/general.module';
import { KreisEntity } from './general/entities/kreis.entity';
import { WithinModule } from './within/within.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ['.env.dev', '.env'], isGlobal: true }),
    TypeOrmModule.forRoot({
      type: process.env.db_postgres_type,
      host: process.env.db_postgres_host,
      port: process.env.db_postgres_port,
      username: process.env.db_postgres_username,
      password: process.env.db_postgres_password,
      database: process.env.db_postgres_database,
      synchronize: JSON.parse(process.env.db_postgres_synchronize),
      logging: JSON.parse(process.env.db_postgres_logging),
      entities: [LandEntity, KreisEntity],
      subscribers: [],
      migrations: [],
    } as TypeOrmModule),
    IntersectModule,
    GeneralModule,
    WithinModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
