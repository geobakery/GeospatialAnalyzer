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
  NearestNeighbourParameterDto,
  SCHEMA_VALID_OUT_SRS,
} from '../general/dto/parameter.dto';
import { TopicDefinitionOutsideDto } from '../general/dto/topic-definition-outside.dto';
import { HTTP_STATUS_SQL_TIMEOUT } from '../general/general.constants';
import { topicDefinitionOutside } from '../general/general.interface';
import { NearestNeighbourService } from './nearest-neighbour.service';

@ApiTags('NearestNeighbour')
@Controller({
  version: '1',
  path: 'nearestNeighbour',
})
@ApiExtraModels(NearestNeighbourParameterDto, EsriJsonDto, GeoJSONFeatureDto)
export class NearestNeighbourController {
  constructor(
    private readonly nearestNeighbourService: NearestNeighbourService,
  ) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available',
    type: TopicDefinitionOutsideDto,
    isArray: true,
  })
  @ApiOperation({
    summary: 'Output all the possible nearestNeighbour topics',
  })
  @Get('topics')
  topic(): topicDefinitionOutside[] {
    return this.nearestNeighbourService.getTopics();
  }

  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(NearestNeighbourParameterDto) },
        SCHEMA_VALID_OUT_SRS,
      ],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Calculates the nearest neighbour',
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
      'Return all features that are within a certain distance of the transferred geometries (see maxDistanceToNeighbour). The number of features can be limited using the count parameter.',
  })
  @Post('/')
  async nearestNeighbour(
    @Body() args: NearestNeighbourParameterDto,
  ): Promise<EsriJsonDto[] | GeoJSONFeatureDto[]> {
    return await this.nearestNeighbourService.handleRequest(args);
  }
}
