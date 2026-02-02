import {
  IsString,
  IsEmail,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer email address',
    example: 'customer@example.com',
  })
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'John Doe',
  })
  @IsString()
  customerName: string;

  @ApiProperty({
    description: 'Order subtotal (before tax and discount)',
    example: 99.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'Tax amount',
    example: 8.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  tax: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 5.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiProperty({
    description: 'Total amount',
    example: 102.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Order items',
    type: [CreateOrderItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
