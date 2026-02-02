import { ApiProperty } from '@nestjs/swagger';

export class ReceiptResponseDto {
  @ApiProperty({
    description: 'Unique receipt identifier',
    example: 'RCP-1706889600-abc123',
  })
  receiptId: string;

  @ApiProperty({
    description: 'Associated order identifier',
    example: 'ORD-1234567890',
  })
  orderId: string;

  @ApiProperty({
    description: 'Cloudinary URL for the receipt PDF',
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/receipts/receipt.pdf',
    nullable: true,
  })
  cloudinaryUrl: string | null;

  @ApiProperty({
    description: 'Timestamp when email was sent',
    example: '2024-02-01T12:00:00Z',
    nullable: true,
  })
  emailSentAt: Date | null;

  @ApiProperty({
    description: 'Timestamp when receipt was generated',
    example: '2024-02-01T12:00:00Z',
  })
  generatedAt: Date;
}
