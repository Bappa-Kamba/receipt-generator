import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod, OrderStatus } from '../entities/order.entity';

export class OrderItemResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Wireless Mouse' })
  productName: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 29.99 })
  unitPrice: number;
}

export class OrderResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'ORD-1706889600-abc123' })
  orderId: string;

  @ApiProperty({ example: 'customer@example.com' })
  customerEmail: string;

  @ApiProperty({ example: 'John Doe' })
  customerName: string;

  @ApiProperty({ example: 99.99 })
  subtotal: number;

  @ApiProperty({ example: 8.00 })
  tax: number;

  @ApiProperty({ example: 5.00 })
  discount: number;

  @ApiProperty({ example: 102.99 })
  total: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CREDIT_CARD })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty({ example: '2024-02-01T12:00:00Z' })
  orderDate: Date;

  @ApiProperty({ example: '2024-02-01T12:00:00Z' })
  createdAt: Date;
}
