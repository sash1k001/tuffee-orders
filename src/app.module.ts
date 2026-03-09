import { Module } from '@nestjs/common';
import { ShiftsModule } from './shifts/shifts.module.js';
import { OrdersModule } from './orders/orders.module.js';

@Module({
  imports: [ShiftsModule, OrdersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}