import { Module } from '@nestjs/common';
import { NearestNeighbourService } from './nearest-neighbour.service';
import { NearestNeighbourController } from './nearest-neighbour.controller';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule],
  providers: [NearestNeighbourService],
  controllers: [NearestNeighbourController],
})
export class NearestNeighbourModule {}
