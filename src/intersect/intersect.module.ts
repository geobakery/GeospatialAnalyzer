import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';
import { LandEntity } from '../general/entities/land.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandEntity])],
  providers: [IntersectService],
  controllers: [IntersectController],
})
export class IntersectModule {}
