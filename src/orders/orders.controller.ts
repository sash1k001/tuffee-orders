import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { OrdersService } from "./orders.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";

@Controller()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @MessagePattern({ cmd: 'orders.create' })
    async createOrder(@Payload() dto: CreateOrderDto) {
        return this.ordersService.createOrder(dto);
    }

    @MessagePattern({ cmd: 'orders.pay' })
    async payOrder(@Payload() data: { orderId: number }) {
        return this.ordersService.payOrder(data.orderId);
    }

    @MessagePattern({ cmd: 'orders.cancel' })
    async cancelOrder(@Payload() data: { orderId: number }) {
        return this.ordersService.cancelOrder(data.orderId);
    }

    @MessagePattern({ cmd: 'orders.complete' })
    async completeOrder(@Payload() data: { orderId: number }) {
        return this.ordersService.completeOrder(data.orderId);
    }

    @MessagePattern({ cmd: 'orders.find' })
    async findOrderById(@Payload() data: { orderId: number }) {
        return this.ordersService.findOrderById(data.orderId);
    }
}