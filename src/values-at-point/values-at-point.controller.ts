import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { ValuesAtPointService } from './values-at-point.service';

@Controller({
  version: '1',
})
@Controller('valuesAtPoint')
export class ValuesAtPointController {
  constructor(private readonly valuesAtPointService: ValuesAtPointService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @Get('valuesAtPoint/topics')
  topic(): topicDefinitionOutside[] {
    return this.valuesAtPointService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the values at point',
    schema: {
      anyOf: [
        { type: 'array', items: { $ref: getSchemaPath(EsriJsonDto) } },
        { type: 'array', items: { $ref: getSchemaPath(GeoJSONFeatureDto) } },
      ],
    },
  })
  @ApiResponse({
    description:
      'The request is too complex to be processed in a timely manner (currently).',
    status: HTTP_STATUS_SQL_TIMEOUT,
  })
  @HttpCode(200)
  @Post('valuesAtPoint')
  async valuesAtPoint(
    @Body() args: ParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.valuesAtPointService.handleRequest(args);
  }
}
