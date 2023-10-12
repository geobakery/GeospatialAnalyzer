import {Controller, Get} from '@nestjs/common';
import { DistrictsService } from './districts.service';
import {District} from "./entities/district.entity";
import {ApiResponse} from "@nestjs/swagger";

@Controller('districts')
export class DistrictsController {
    constructor(private readonly districtsService: DistrictsService) {
    }
    @Get()
    @ApiResponse({
        status: 200,
        description: 'find all districts in Sachsen',
        type: District,
        isArray: true
    })
    findAll(): District[] {
        return this.districtsService.getall();
    }
}
