import { Controller, Get } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { topicDefinitionOutside } from '../general/general.interface';
import { TopicDefinitionOutsideDto } from '../general/dto/topic-definition-outside.dto';

@ApiTags('Topics')
@Controller({
  version: '1',
  path: 'topics',
})
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all topics available',
    type: TopicDefinitionOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all topics',
  })
  @Get('/')
  topic(): topicDefinitionOutside[] {
    return this.topicsService.getTopics();
  }
}
