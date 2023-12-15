import { Module } from '@nestjs/common';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule],
  controllers: [ValuesAtPointController],
  providers: [ValuesAtPointService],
})
export class ValuesAtPointModule {}
