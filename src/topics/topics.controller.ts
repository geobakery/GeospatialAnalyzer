import { Controller, Get } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { topicDefinitionOutside } from '../general/general.interface';

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
    type: String,
    isArray: false,
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.topicsService.getTopics();
  }
}
