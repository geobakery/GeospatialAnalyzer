import { Module } from '@nestjs/common';
import { GeneralService } from './general.service';
import { TransformModule } from '../transform/transform.module';

@Module({
  imports: [TransformModule],
  providers: [GeneralService],
  exports: [GeneralService],
  controllers: [],
})
export class GeneralModule {}
