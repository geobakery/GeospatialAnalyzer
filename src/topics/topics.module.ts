import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { TopicsController } from './topics.controller';
import { TransformModule } from '../transform/transform.module';

@Module({
  imports: [GeneralModule, TransformModule],
  providers: [TopicsService],
  controllers: [TopicsController]
})
export class TopicsModule {}
