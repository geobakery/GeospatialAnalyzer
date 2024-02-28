import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { WithinService } from './within.service';
import { ApiResponse } from '@nestjs/swagger';
import { ParameterDto } from '../general/dto/parameter.dto';
import { GeoJSON } from 'typeorm';
import {
  ErrorResponse,
  EsriJSON,
  topicDefinitionOutside,
} from '../general/general.interface';
import { GeoJSONFeatureDto } from '../general/dto/geo-json.dto';
import { TopicDefinitonOutsideDto } from '../general/dto/topic-definiton-outside.dto';
import { EsriJsonDto } from '../general/dto/esri-json.dto';

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
    type: GeoJSONFeatureDto,
    isArray: true,
  })
  @HttpCode(200)
  @Post('within')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSONFeatureDto[] | EsriJsonDto[]> {
    return await this.withinService.calculateWithin(args);
  }
}
