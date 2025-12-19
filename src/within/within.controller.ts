import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import {
  SCHEMA_VALID_OUT_SRS,
  WithinParameterDto,
} from '../general/dto/parameter.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { WithinService } from './within.service';

@ApiTags('Within')
@Controller({
  version: '1',
  path: 'within',
})
@ApiExtraModels(WithinParameterDto, EsriJsonDto, GeoJSONFeatureDto)
export class WithinController {
  constructor(private readonly withinService: WithinService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all the possible within topics',
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.withinService.getTopics();
  }

  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(WithinParameterDto) },
        SCHEMA_VALID_OUT_SRS,
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calculates the within',
    content: {
      'application/json': {
        schema: {
          anyOf: [
            { type: 'array', items: { $ref: getSchemaPath(EsriJsonDto) } },
            {
              type: 'array',
              items: { $ref: getSchemaPath(GeoJSONFeatureDto) },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HTTP_STATUS_SQL_TIMEOUT,
    description:
      'The request is too complex to be processed in a timely manner (currently).',
  })
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Return all features in which the transferred geometries are completely contained',
  })
  @Post('/')
  async within(
    @Body() args: WithinParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.withinService.handleRequest(args);
  }
}
