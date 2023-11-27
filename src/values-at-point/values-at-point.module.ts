import { Module } from '@nestjs/common';
import { ValuesAtPointController } from './values-at-point.controller';
import { ValuesAtPointService } from './values-at-point.service';

@Module({
  controllers: [ValuesAtPointController],
  providers: [ValuesAtPointService]
})
export class ValuesAtPointModule {}
