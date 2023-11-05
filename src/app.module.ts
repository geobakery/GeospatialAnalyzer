import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DistrictsModule } from './districts/districts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { District } from './districts/entities/district.entity';
import { ConfigModule } from '@nestjs/config';
import { IntersectService } from './intersect/intersect.service';
import { IntersectController } from './intersect/intersect.controller';
import { IntersectModule } from './intersect/intersect.module';
import { GeneralService } from './general/general.service';

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
      entities: [District],
      subscribers: [],
      migrations: [],
    } as TypeOrmModule),
    DistrictsModule,
    IntersectModule,
  ],
  controllers: [AppController, IntersectController],
  providers: [AppService, IntersectService, GeneralService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
