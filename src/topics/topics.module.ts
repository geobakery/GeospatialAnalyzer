import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { GeneralModule } from '../general/general.module';
import { TopicsController } from './topics.controller';

@Module({
  imports: [GeneralModule],
  providers: [TopicsService],
  controllers: [TopicsController],
})
export class TopicsModule {}
