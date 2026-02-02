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
    description: 'Signed URL for the receipt PDF (stored in Supabase Storage for instance)',
    example: 'https://your-project.storage.supabase.com/receipts/receipt.pdf?...',
    nullable: true,
  })
  storageUrl: string | null;

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
