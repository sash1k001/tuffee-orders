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
}