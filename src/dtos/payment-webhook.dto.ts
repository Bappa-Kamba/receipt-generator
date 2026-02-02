import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentWebhookDto {
  @ApiProperty({
    description: 'The unique order identifier',
    example: 'ORD-1234567890-001',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}
