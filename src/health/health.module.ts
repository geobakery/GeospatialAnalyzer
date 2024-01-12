import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [GeneralModule],
  providers: [HealthService],
  controllers: [HealthController],
})
export class HealthModule {}
