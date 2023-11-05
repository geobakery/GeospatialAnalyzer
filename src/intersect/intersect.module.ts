import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IntersectService } from './intersect.service';
import { IntersectController } from './intersect.controller';

// @Module({
//   imports: [TypeOrmModule.forFeature([])],
//   providers: [IntersectService],
//   controllers: [IntersectController],
// })
@Module({})
export class IntersectModule {}
