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
import { ErrorResponse, EsriJSON } from '../general/general.interface';
import { ParameterDto } from '../general/dto/parameter.dto';

@Controller({
  version: '1',
})
@Controller('intersect')
export class IntersectController {
  constructor(private readonly intersectService: IntersectService) {}

  @ApiResponse({
    status: 200,
    description: 'Shows all attributes and parameters available ',
    type: String,
    isArray: true,
  })
  @Get('intersect/topics')
  topic(): string[] {
    return this.intersectService.getTopics();
  }

  @ApiResponse({
    status: 200,
    description: 'Calculate the intersections',
    type: String,
  })
  @HttpCode(200)
  @Post('intersect')
  async intersect(
    @Body() args: ParameterDto,
  ): Promise<GeoJSON[] | EsriJSON | ErrorResponse | any[]> {
    try {
      if (this._checkIntersectParameter(args)) {
        return await this.intersectService.calculateIntersect(args);
      }
    } catch (e) {
      //just an example error
      throw new HttpException(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  _checkIntersectParameter(args: ParameterDto): boolean {
    if (args.timeout <= 1) {
      throw new HttpException('Bad Value for timeout', HttpStatus.BAD_REQUEST);
    }
    return true;
  }
}
