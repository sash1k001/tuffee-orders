import { IsInt, IsArray, ValidateNested, IsEnum, Min } from "class-validator";
import { Type } from "class-transformer";
import { PaymentType } from "../../../generated/prisma/enums.js";

export class OrderItemDto {
    @IsInt()
    productId: number;

    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @IsInt()
    cashierId: number;

    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}