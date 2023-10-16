import { Injectable } from '@nestjs/common';
import { District } from './entities/district.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(District)
    private districtRepository: Repository<District>,
  ) {}

  findAll(): Promise<District[]> {
    return this.districtRepository.find();
  }

  findOne(id: number): Promise<District | null> {
    return this.districtRepository.findOneBy({ id });
  }
}
