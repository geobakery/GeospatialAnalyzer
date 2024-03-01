import { Module } from '@nestjs/common';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule, TransformModule],
  controllers: [ValuesAtPointController],
  providers: [ValuesAtPointService],
})
export class ValuesAtPointModule {}
