import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';

@Module({
  providers: [DistrictsService],
  controllers: [DistrictsController]
})
export class DistrictsModule {}
