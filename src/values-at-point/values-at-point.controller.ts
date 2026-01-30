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
  ValuesAtPointParameterDto,
} from '../general/dto/parameter.dto';
import { TopicDefinitionOutsideDto } from '../general/dto/topic-definition-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { ValuesAtPointService } from './values-at-point.service';

@ApiTags('ValuesAtPoint')
@Controller({
  version: '1',
  path: 'valuesAtPoint',
})
@ApiExtraModels(ValuesAtPointParameterDto, EsriJsonDto, GeoJSONFeatureDto)
export class ValuesAtPointController {
  constructor(private readonly valuesAtPointService: ValuesAtPointService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitionOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all the possible valuesAtPoint topics',
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.valuesAtPointService.getTopics();
  }

  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ValuesAtPointParameterDto) },
        SCHEMA_VALID_OUT_SRS,
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calculates the values at point',
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
    summary: 'Return the values at the transferred point',
  })
  @Post('/')
  async valuesAtPoint(
    @Body() args: ValuesAtPointParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.valuesAtPointService.handleRequest(args);
  }
}
