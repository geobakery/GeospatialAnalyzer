import { Controller, Get } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { topicDefinitionOutside } from '../general/general.interface';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';

@ApiTags('Topics')
@Controller({
  version: '1',
})
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @ApiResponse({
    status: 200,
    description: 'Show all topics',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.topicsService.getTopics();
  }
}
