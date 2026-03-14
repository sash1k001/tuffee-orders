import { Controller } from "@nestjs/common";
import { MessagePattern, Payload } from "@nestjs/microservices";
import { ShiftsService } from "./shifts.service.js";
import { OpenShiftDto } from "./dto/open-shift.dto.js";
import { CloseShiftDto } from "./dto/close-shift.dto.js";

@Controller()
export class ShiftsController {
    constructor(private readonly shiftsService: ShiftsService) {}

    @MessagePattern({ cmd: 'shifts.open' })
    async openShift(@Payload() dto: OpenShiftDto) {
        return this.shiftsService.openShift(dto);
    }

    @MessagePattern({ cmd: 'shifts.close' })
    async closeShift(@Payload() dto: CloseShiftDto) {
        return this.shiftsService.closeShift(dto);
    }

    @MessagePattern({ cmd: 'shifts.findAll'})
    async findAllShifts() {
        return this.shiftsService.findAllShifts();
    }
}