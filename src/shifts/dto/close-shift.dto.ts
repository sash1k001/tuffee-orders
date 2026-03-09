import { IsInt, IsNumber, Min } from "class-validator";

export class CloseShiftDto {
    @IsInt()
    cashierId: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0, { message: 'фактическая сумма в кассе не может быть отрицательной' })
    actualCash: number;
}