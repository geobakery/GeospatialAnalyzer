import { Module } from '@nestjs/common';
import { GeneralService } from './general.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandEntity } from './entities/land.entity';
import { KreisEntity } from './entities/kreis.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandEntity, KreisEntity])],
  providers: [GeneralService],
  exports: [GeneralService],
  controllers: [],
})
export class GeneralModule {}
