import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DistrictsModule } from './districts/districts.module';

@Module({
  imports: [DistrictsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
