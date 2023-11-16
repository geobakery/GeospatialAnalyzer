import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';
import { LandEntity } from '../general/entities/land.entity';
import { GeneralModule } from '../general/general.module';
import { KreisEntity } from '../general/entities/kreis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandEntity, KreisEntity]), GeneralModule],
  providers: [IntersectService],
  controllers: [IntersectController],
})
export class IntersectModule {}
