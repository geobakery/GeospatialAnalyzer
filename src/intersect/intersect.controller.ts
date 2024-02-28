import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { IntersectService } from './intersect.service';
import { GeoJSON } from 'typeorm';
import {
  ErrorResponse,
  EsriJSON,
  topicDefinitionOutside,
} from '../general/general.interface';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';

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
    type: GeoJSONFeatureDto,
    isArray: true,
  })
  @HttpCode(200)
  @Post('intersect')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    return await this.intersectService.calculateIntersect(args);
  }
}
