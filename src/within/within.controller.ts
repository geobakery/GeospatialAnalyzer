import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { topicDefinitionOutside } from '../general/general.interface';
import { WithinService } from './within.service';

@Controller({
  version: '1',
})
@Controller('within')
export class WithinController {
  constructor(private readonly withinService: WithinService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @Get('within/topics')
  topic(): topicDefinitionOutside[] {
    return this.withinService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the within',
    schema: {
      anyOf: [
        { type: 'array', items: { $ref: getSchemaPath(EsriJsonDto) } },
        { type: 'array', items: { $ref: getSchemaPath(GeoJSONFeatureDto) } },
      ],
    },
  })
  @HttpCode(200)
  @Post('within')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.withinService.calculateWithin(args);
  }
}
