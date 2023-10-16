import { Controller, Get } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { District } from './entities/district.entity';
import { ApiResponse } from '@nestjs/swagger';

@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @ApiResponse({
    status: 200,
    description: 'find all districts in Sachsen',
    type: District,
    isArray: true,
  })
  @Get()
  async findAll(): Promise<District[]> {
    return await this.districtsService.findAll();
  }
}
