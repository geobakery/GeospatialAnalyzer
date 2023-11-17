import { Module } from '@nestjs/common';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule],
  providers: [IntersectService],
  controllers: [IntersectController],
})
export class IntersectModule {}
