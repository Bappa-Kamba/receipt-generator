import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Receipt, ReceiptStatus } from '../entities/receipt.entity';
import { PdfService, StorageService } from '../services';
import { promises as fs } from 'fs';
import { format } from 'date-fns';
import { ensureJob } from '../common/utils.queue';

interface ReceiptJobData {
  orderId: string;
}

@Processor('receipt-generation')
export class ReceiptProcessor {
  private readonly logger = new Logger(ReceiptProcessor.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    @InjectQueue('receipt-email')
    private emailQueue: Queue,
    private pdfService: PdfService,
    private storageService: StorageService,
  ) {}

  @Process('generate-receipt')
  async handleReceiptGeneration(job: Job<ReceiptJobData>) {
    const { orderId } = job.data;
    this.logger.log(`Processing receipt generation for order ${orderId}`);

    let pdfPath: string | undefined;

    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['customer', 'orderItems'],
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    let receipt = await this.receiptRepository.findOne({ where: { orderId: order.id } });

    if (!receipt) {
      const receiptId = this.generateReceiptId();
      try {
        receipt = this.receiptRepository.create({
          receiptId,
          orderId: order.id,
          status: ReceiptStatus.PENDING,
          generatedAt: new Date(),
        });
        receipt = await this.receiptRepository.save(receipt);
        this.logger.log(`Receipt record created: ${receipt.receiptId}`);
      } catch (e: any) {
        receipt = await this.receiptRepository.findOne({ where: { orderId: order.id } });
        if (!receipt) throw e;
      }
    }

    if (receipt.emailSentAt) {
      this.logger.log(`Receipt ${receipt.receiptId} already completed (email sent). Skipping.`);
      return { success: true, receiptId: receipt.receiptId, skipped: true };
    }

    try {
      if (!receipt.storageKey) {
        const { filePath } = await this.pdfService.generateReceiptPdf(order, receipt.receiptId);
        pdfPath = filePath;

        const objectKey = `receipts/${receipt.receiptId}.pdf`;
        await this.storageService.uploadPdf(filePath, objectKey);

        receipt.storageKey = objectKey;
        receipt.status = ReceiptStatus.PDF_UPLOADED;
        await this.receiptRepository.save(receipt);
      }

      await ensureJob(
        this.emailQueue,
        'send-receipt-email',
        `receipt-email:${receipt.receiptId}`,
        {
          receiptId: receipt.receiptId,
          orderId: order.orderId,
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 10000
          },
          removeOnComplete: true
        });

      this.logger.log(`Queued email job for receipt ${receipt.receiptId}`);

      return { success: true, receiptId: receipt.receiptId };
    } catch (err: any) {
      receipt.status = ReceiptStatus.FAILED;
      receipt.lastError = err?.message ?? String(err);
      await this.receiptRepository.save(receipt);
      throw err;
    } finally {
      if (pdfPath) await this.cleanupFile(pdfPath);
    }
  }

  private generateReceiptId(): string {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const timestamp = Date.now().toString().slice(-6);
    return `RCP-${dateStr}-${timestamp}`;
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      this.logger.log(`Cleaned up file: ${filePath}`);
    } catch (error) {
      this.logger.warn(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }
}
