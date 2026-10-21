import { Module } from '@nestjs/common';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtGridController } from './values-at-point.controller';
import { ValuesAtGridService } from './values-at-point.service';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule, TransformModule],
  controllers: [ValuesAtGridController],
  providers: [ValuesAtGridService],
})
export class ValuesAtGridModule {}
