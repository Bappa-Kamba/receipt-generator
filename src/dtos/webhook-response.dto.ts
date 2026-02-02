import { ApiProperty } from '@nestjs/swagger';

export class WebhookResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Receipt generation job enqueued successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Background job identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  jobId: string | null;

  @ApiProperty({
    description: 'Receipt identifier if already exists',
    example: 'RCP-20240202-ABC123',
    required: false,
  })
  receiptId?: string;
}
