import { Module } from '@nestjs/common';
import { TransformModule } from '../transform/transform.module';
import { ValuesAtGridController } from './values-at-grid.controller';
import { ValuesAtGridService } from './values-at-grid.service';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule, TransformModule],
  controllers: [ValuesAtGridController],
  providers: [ValuesAtGridService],
})
export class ValuesAtGridModule {}
