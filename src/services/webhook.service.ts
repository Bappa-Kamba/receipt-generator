import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Order, OrderStatus } from '../entities/order.entity';
import { Receipt } from '../entities/receipt.entity';

@Injectable()
export class WebhookService {
  constructor(
    @InjectQueue('receipt-generation')
    private receiptQueue: Queue,
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
        return {
          message: 'Receipt already exists',
          receiptId: existingReceipt.receiptId,
          jobId: null,
        };
      }

      const job = await this.receiptQueue.add(
        'generate-receipt',
        { orderId },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      return {
        message: 'Receipt generation queued',
        jobId: job.id.toString(),
      };
    });
  }
}
