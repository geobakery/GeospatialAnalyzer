import { Module } from '@nestjs/common';
import { TransformController } from './transform.controller';
import { TransformService } from './transform.service';

@Module({
  controllers: [TransformController],
  providers: [TransformService],
  exports: [TransformService],
})
export class TransformModule {}
