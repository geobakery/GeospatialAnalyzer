import { Module } from '@nestjs/common';
import { GeneralService } from './general.service';

@Module({
  imports: [],
  providers: [GeneralService],
  exports: [GeneralService],
  controllers: [],
})
export class GeneralModule {}
