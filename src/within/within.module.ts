import { Module } from '@nestjs/common';
import { WithinService } from './within.service';
import { GeneralModule } from '../general/general.module';
import { WithinController } from './within.controller';
import { TransformModule } from '../transform/transform.module';

@Module({
  imports: [GeneralModule, TransformModule],
  providers: [WithinService],
  controllers: [WithinController],
})
export class WithinModule {}
