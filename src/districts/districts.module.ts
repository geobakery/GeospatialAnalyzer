import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { District } from './entities/district.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([District])],
  providers: [DistrictsService],
  controllers: [DistrictsController],
})
export class DistrictsModule {}
