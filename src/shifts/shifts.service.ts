import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { OpenShiftDto } from "./dto/open-shift.dto.js";
import { CloseShiftDto } from "./dto/close-shift.dto.js";

@Injectable()
export class ShiftsService {
    constructor(private readonly prisma: PrismaService) {}

    async openShift(dto: OpenShiftDto) {
        const activeShift = await this.prisma.shift.findFirst({
            where: { status: 'OPEN' },
        });

        if (activeShift) {
            throw new BadRequestException('ошибка, сначала закройте текущую смену');
        }

        const newShift = await this.prisma.shift.create({
            data: {
                cashierId: dto.cashierId,
                startingCash: dto.startingCash,
                status: 'OPEN',
            },
        });

        return {
            message: 'кассовая смена успешно открыта',
            shift: newShift,
        };
    }

    async closeShift(dto: CloseShiftDto) {
        const activeShift = await this.prisma.shift.findFirst({
            where: { status: 'OPEN' },
        });

        if (!activeShift) {
            throw new BadRequestException('нет открытой кассовой смены для закрытия');
        }

        const pendingOrders = await this.prisma.order.findMany({
            where: {
                shiftId: activeShift.id,
                status: 'PENDING',
            },
            select: {
                id: true,
            }
        });

        if (pendingOrders.length > 0) {
            const pendingIds = pendingOrders.map((order) => order.id).join(', ');
            throw new BadRequestException(`есть неоплаченные заказы (ID: ${pendingIds}), смена не может быть закрыта`)
        }

        const cashOrdersSum = await this.prisma.order.aggregate({
            where: {
                shiftId: activeShift.id,
                paymentType: 'CASH',
                status: { in: ['PAID', 'COMPLETED'] }
            },
            _sum: {
                totalAmount: true,
            },
        });

        const cashEarnings = cashOrdersSum._sum.totalAmount ? cashOrdersSum._sum.totalAmount.toNumber() : 0;
        const expectedCash = activeShift.startingCash.toNumber() + cashEarnings;
        const discrepamcy = dto.actualCash - expectedCash;

        const closedShift = await this.prisma.shift.update({
            where: { id: activeShift.id },
            data: {
                status: 'CLOSED',
                closedAt: new Date(),
                expectedCash: expectedCash,
                actualCash: dto.actualCash,
                discrepancy: discrepamcy,
            },
        });

        return {
            message: 'смена закрыта',
            shift: closedShift,
        };
    }

    async findAllShifts() {
        const shifts = await this.prisma.shift.findMany({
            orderBy: {
                openedAt: 'desc',
            },
            include: {
                orders: true,
            },
        });

        return shifts;
    }
}