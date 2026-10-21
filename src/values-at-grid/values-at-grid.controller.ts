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
  ValuesAtGridParameterDto,
} from '../general/dto/parameter.dto';
import { TopicDefinitionOutsideDto } from '../general/dto/topic-definition-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { ValuesAtGridService } from './values-at-grid.service';

@ApiTags('ValuesAtGrid')
@Controller({
  version: '2',
  path: 'valuesAtGrid',
})
@ApiExtraModels(ValuesAtGridParameterDto, EsriJsonDto, GeoJSONFeatureDto)
export class ValuesAtGridController {
  constructor(private readonly valuesAtGridService: ValuesAtGridService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitionOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all the possible valuesAtGrid topics',
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.valuesAtGridService.getTopics();
  }

  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(ValuesAtGridParameterDto) },
        SCHEMA_VALID_OUT_SRS,
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calculates the values at the transferred point',
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
  async valuesAtGrid(
    @Body() args: ValuesAtGridParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.valuesAtGridService.handleRequest(args);
  }
}
