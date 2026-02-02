import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentWebhookDto, WebhookResponseDto } from '../dtos';
import { WebhookService } from '../services/webhook.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Public()
  @Post('payment-success')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Handle payment success webhook' })
  @ApiResponse({
    status: 202,
    description: 'Receipt generation job enqueued',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Payment not confirmed' })
  async handlePaymentSuccess(
    @Body() dto: PaymentWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhookService.handlePaymentSuccess(dto.orderId);
  }
}
