import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { EsriJsonDto } from '../general/dto/esri-json.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { ParameterDto } from '../general/dto/parameter.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { topicDefinitionOutside } from '../general/general.interface';
import { IntersectService } from './intersect.service';

@Controller({
  version: '1',
})
@Controller('intersect')
export class IntersectController {
  constructor(private readonly intersectService: IntersectService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @Get('intersect/topics')
  topic(): topicDefinitionOutside[] {
    return this.intersectService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the intersections',
    schema: {
      anyOf: [
        { type: 'array', items: { $ref: getSchemaPath(EsriJsonDto) } },
        { type: 'array', items: { $ref: getSchemaPath(GeoJSONFeatureDto) } },
      ],
    },
  })
  @HttpCode(200)
  @Post('intersect')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    try {
      return await this.intersectService.calculateIntersect(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
