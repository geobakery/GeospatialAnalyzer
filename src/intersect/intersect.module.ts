import { Module } from '@nestjs/common';
import { TransformModule } from '../transform/transform.module';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule, TransformModule],
  providers: [IntersectService],
  controllers: [IntersectController],
})
export class IntersectModule {}
