import { Module } from "@nestjs/common";
import { ShiftsController } from "./shifts.controller.js";
import { ShiftsService } from "./shifts.service.js";
import { PrismaService } from "../prisma.service.js";

@Module({
    controllers: [ShiftsController],
    providers: [ShiftsService, PrismaService],
})
export class ShiftsModule {}