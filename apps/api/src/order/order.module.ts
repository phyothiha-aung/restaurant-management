import { Module } from '@nestjs/common';
import { PaginationModule } from '../common/pagination/pagination.module.js';
import { UserModule } from '../user/user.module.js';
import { OrderController } from './order.controller.js';
import { OrderService } from './providers/order.service.js';

@Module({
  imports: [PaginationModule, UserModule],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
