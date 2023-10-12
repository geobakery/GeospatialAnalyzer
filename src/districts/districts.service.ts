import { Injectable } from '@nestjs/common';
import {District} from "./entities/district.entity";

@Injectable()
export class DistrictsService {
    private readonly districts: District[] = [];

    getall(): District[] {
        return this.districts;
    }
}
