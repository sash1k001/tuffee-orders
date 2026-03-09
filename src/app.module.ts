import { Module } from '@nestjs/common';
import { ShiftsModule } from './shifts/shifts.module.js';

@Module({
  imports: [ShiftsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}