import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';
import { LandEntity } from '../general/entities/land.entity';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [TypeOrmModule.forFeature([LandEntity]), GeneralModule],
  providers: [IntersectService],
  controllers: [IntersectController],
})
export class IntersectModule {}
