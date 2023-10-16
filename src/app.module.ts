import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DistrictsModule } from './districts/districts.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { District } from './districts/entities/district.entity';
import { ConfigModule } from '@nestjs/config';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
