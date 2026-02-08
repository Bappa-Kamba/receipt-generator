import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Receipt, ReceiptStatus } from '../entities/receipt.entity';
import { EmailService, StorageService } from '../services';

interface EmailJobData {
  receiptId: string;
  orderId: string;
}

@Processor('receipt-email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    private emailService: EmailService,
    private storageService: StorageService,
  ) {}

  @Process('send-receipt-email')
  async handleReceiptEmail(job: Job<EmailJobData>) {
    const { receiptId, orderId } = job.data;
    this.logger.log(`Processing receipt email for receipt ${receiptId}, order ${orderId}`);

    const receipt = await this.receiptRepository.findOne({ 
      where: { receiptId },
      relations: ['order'],
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptId} not found`);
    }

    // Idempotency check: if email already sent, skip
    if (receipt.emailSentAt) {
      this.logger.log(`Receipt ${receiptId} email already sent. Skipping.`);
      return { success: true, receiptId, skipped: true };
    }

    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['customer', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    try {
      const url = await this.storageService.generateSignedUrl(receipt.storageKey);
      this.logger.log(`Generated signed URL for receipt ${receiptId}`);

      await this.emailService.sendReceiptEmail({
        to: order.customer.email,
        customerName: order.customer.name,
        orderId: order.orderId,
        receiptId: receipt.receiptId,
        total: Number(order.total),
        url,
      });

      receipt.emailSentAt = new Date();
      receipt.status = ReceiptStatus.EMAIL_SENT;
      receipt.lastError = '';
      await this.receiptRepository.save(receipt);

      return { success: true, receiptId };
    } catch (err: any) {
      receipt.status = ReceiptStatus.FAILED;
      receipt.lastError = err?.message ?? String(err);
      await this.receiptRepository.save(receipt);
      this.logger.error(`Failed to send receipt email for ${receiptId}: ${err.message}`);
      throw err;
    }
  }
}
