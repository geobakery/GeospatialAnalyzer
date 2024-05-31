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
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { ValuesAtPointService } from './values-at-point.service';

@ApiTags('ValuesAtPoint')
@Controller({
  version: '1',
})
@Controller('valuesAtPoint')
@ApiExtraModels(ValuesAtPointParameterDto)
export class ValuesAtPointController {
  constructor(private readonly valuesAtPointService: ValuesAtPointService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all the possible valuesAtPoint topics',
  })
  @Get('valuesAtPoint/topics')
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
  @ApiOperation({
    summary: 'Return the values at the transferred point',
  })
  @Post('valuesAtPoint')
  async valuesAtPoint(
    @Body() args: ValuesAtPointParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.valuesAtPointService.handleRequest(args);
  }
}
