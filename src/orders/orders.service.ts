import { Injectable, BadRequestException, NotFoundException, Inject } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom } from "rxjs";

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject('CATALOG_CLIENT') private readonly catalogClient: ClientProxy,
        @Inject('INVENTORY_CLIENT') private readonly inventoryClient: ClientProxy,
    ) {}

    async createOrder(dto: CreateOrderDto) {
        const activeShift = await this.prisma.shift.findFirst({
            where: { status: 'OPEN' },
        });

        if (!activeShift) {
            throw new BadRequestException('невозможно создать заказ: кассовая смена закрыта');
        }

        const productIds = dto.items.map((item) => item.productId);

        let catalogProducts: any[];
        try {
            catalogProducts = await firstValueFrom(
                this.catalogClient.send({ cmd: 'products.find_by_ids' }, { ids: productIds })
            );
        } catch (error) {
            throw new BadRequestException('ошибка при связи с сервисом каталог');
        }

        let totalAmount = 0;
        const orderItemsData: { productId: number; quantity: number; price: number }[] = [];

        for (const item of dto.items) {
            const product = catalogProducts.find((p) => p.id === item.productId);

            if (!product) {
                throw new NotFoundException(`продукт с ID ${item.productId} не найден в каталоге`);
            }

            const price = parseFloat(product.price);
            totalAmount += price * item.quantity;

            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: price,
            });
        }

        const newOrder = await this.prisma.order.create({
            data: {
                shiftId: activeShift.id,
                cashierId: dto.cashierId,
                paymentType: dto.paymentType,
                totalAmount: totalAmount,
                status: 'PENDING',
                items: {
                    create: orderItemsData,
                },
            },
            include: {
                items: true,
            }
        });

        return {
            message: 'заказ успешно создан',
            order: newOrder,
        };
    }

    async payOrder(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException(`заказ с ID ${orderId} не найден`);
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException(`оплатить можно только ожидающий заказ (pending)`);
        }

        const paidOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' },
        });

        for (const item of order.items) {
            try {
                await firstValueFrom(
                    this.inventoryClient.send(
                        { cmd: 'recipes.sell' },
                        { productId: item.productId, quantity: item.quantity, orderId: item.orderId },
                    )
                );
            } catch (error) {
                console.error(`ошибка списания со склада для товара ID ${item.productId}:`, error);
            }
        }

        return {
            message: 'заказ успешно оплачен. ингредиенты списаны со склада.',
            order: paidOrder,
        };
    }

    async cancelOrder(orderId: number) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            throw new NotFoundException(`заказ с ID ${orderId} не найден`);
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException('отменить можно только неоплаченный заказ');
        }

        const cancelledOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });

        return {
            message: 'заказ отменен. склад не затронут.',
            order: cancelledOrder,
        };
    }
}