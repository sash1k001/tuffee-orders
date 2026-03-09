import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { PrismaService } from "../prisma.service.js";
import { OrdersService } from "./orders.service.js";
import { OrdersController } from "./orders.controller.js";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'CATALOG_CLIENT',
                transport: Transport.TCP,
                options: {
                    host: '0.0.0.0',
                    port: 3001,
                },
            },
            {
                name: 'INVENTORY_CLIENT',
                transport: Transport.TCP,
                options: {
                    host: '0.0.0.0',
                    port: 3002,
                },
            },
        ]),
    ],
    controllers: [OrdersController],
    providers: [OrdersService, PrismaService],
})
export class OrdersModule {}