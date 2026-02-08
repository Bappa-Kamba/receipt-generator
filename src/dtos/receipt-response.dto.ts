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
    description: 'The storage key for the receipt PDF (stored in Supabase Storage)',
    example: 'receipt/RCP-20260208-212121',
    nullable: true,
  })
  storageKey: string | null;

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
