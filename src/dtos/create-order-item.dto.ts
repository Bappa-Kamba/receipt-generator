import { IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Wireless Mouse',
  })
  @IsString()
  productName: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Unit price',
    example: 29.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}
