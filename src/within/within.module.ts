import { Module } from '@nestjs/common';
import { WithinService } from './within.service';
import { GeneralModule } from '../general/general.module';
import { WithinController } from './within.controller';

@Module({
  imports: [GeneralModule],
  providers: [WithinService],
  controllers: [WithinController],
})
export class WithinModule {}
