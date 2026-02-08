import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Order, OrderStatus } from '../entities/order.entity';
import { Receipt, ReceiptStatus } from '../entities/receipt.entity';
import { ensureJob } from 'src/common/utils.queue';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectQueue('receipt-generation')
    private receiptQueue: Queue,
    @InjectQueue('receipt-email')
    private emailQueue: Queue,
    private dataSource: DataSource,
  ) {}

  async handlePaymentSuccess(
    orderId: string,
  ): Promise<{ message: string; jobId: string | null; receiptId?: string }> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager
        .getRepository(Order)
        .createQueryBuilder('o')
        .where('o.orderId = :orderId', { orderId })
        .setLock('pessimistic_write', undefined, ['o'])
        .getOne();

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      const orderWithCustomer = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['customer'],
      });

      if (!orderWithCustomer) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      if (orderWithCustomer.status !== OrderStatus.CONFIRMED) {
        throw new BadRequestException('Order not confirmed');
      }

      const existingReceipt = await manager.findOne(Receipt, {
        where: { order: { id: order.id } },
      });

      if (existingReceipt) {
        if (existingReceipt.emailSentAt || existingReceipt.status === ReceiptStatus.EMAIL_SENT) {
          this.logger.log('Recipt already sent already, nothing to process further');
          return {
            message: 'Receipt already generated and sent',
            receiptId: existingReceipt.receiptId,
            jobId: null,
          };
        }

        // Not done: resume pipeline
        if (existingReceipt.storageKey) {
          // PDF uploaded, email pending/failed
          this.logger.warn('Receipt found: PDF uploaded, email not sent. Attempting to send email again');

          const job = await ensureJob(
            this.emailQueue,
            'send-receipt-email',
            `receipt-email:${existingReceipt.receiptId}`,
            { receiptId: existingReceipt.receiptId, orderId },
            { attempts: 5, backoff: { type: 'exponential', delay: 10_000 }, removeOnComplete: true },
          );

          return {
            message: 'Receipt exists; email queued',
            receiptId: existingReceipt.receiptId,
            jobId: job.id.toString(),
          };
        }

        // Receipt exists but no PDF stored yet (resume generation)
        this.logger.warn('Receipt found: not uploaded yet. Attempting upload again');
        const job = await ensureJob(
          this.receiptQueue,
          'generate-receipt',
          `receipt-generate:${orderId}`,
          { orderId },
          {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 5000
            },
            removeOnComplete: true
          });

        return {
          message: 'Receipt exists; generation queued',
          receiptId: existingReceipt.receiptId,
          jobId: job.id.toString(),
        };
      }

      const job = await ensureJob(
        this.receiptQueue,
        'generate-receipt',
        `receipt-generate:${orderId}`,
        { orderId },
        {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          removeOnComplete: true
        });

      return {
        message: 'Receipt generation queued',
        jobId: job.id.toString(),
      };
    });
  }
}
