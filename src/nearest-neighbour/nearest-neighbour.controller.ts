import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { NearestNeighbourService } from './nearest-neighbour.service';
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

@Controller({
  version: '1',
})
@Controller('nearestNeighbour')
export class NearestNeighbourController {
  constructor(
    private readonly nearestNeighbourService: NearestNeighbourService,
  ) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: TopicDefinitonOutsideDto,
    isArray: true,
  })
  @Get('nearestNeighbour/topics')
  topic(): topicDefinitionOutside[] {
    return this.nearestNeighbourService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the nearest NEIGHBOUR',
    type: GeoJSONFeatureDto,
    isArray: true,
  })
  @HttpCode(200)
  @Post('nearestNeighbour')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSON[] | EsriJSON | ErrorResponse | any[]> {
    try {
      return await this.nearestNeighbourService.calculateNearestNeighbour(args);
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
