import { IsInt, IsNumber, Min } from "class-validator";

export class OpenShiftDto {
    @IsInt()
    cashierId: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0, { message: 'сумма в кассе не может быть отрицательной' })
    startingCash: number;
}