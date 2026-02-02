import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Receipt } from '../entities/receipt.entity';
import { PdfService, EmailService, StorageService, UploadResult } from '../services';
import { promises as fs } from 'fs';
import { format } from 'date-fns';

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
    private pdfService: PdfService,
    private emailService: EmailService,
    private storageService: StorageService,
  ) {}

  @Process('generate-receipt')
  async handleReceiptGeneration(job: Job<ReceiptJobData>) {
    const { orderId } = job.data;
    this.logger.log(`Processing receipt generation for order ${orderId}`);
    let pdfPath: string | undefined;

    try {
      const order = await this.orderRepository.findOne({
        where: { orderId },
        relations: ['customer', 'orderItems'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      const receiptId = this.generateReceiptId();

      this.logger.log(`Generating PDF for receipt ${receiptId}`);
      const { filePath, buffer } = await this.pdfService.generateReceiptPdf(
        order,
        receiptId,
      );
      pdfPath = filePath;
      let storageResult: UploadResult | undefined;

      try {
        this.logger.log(`Uploading PDF to storage`);
        storageResult = await this.storageService.uploadPdf(
          filePath,
          receiptId,
        );
      } catch (error) {
        this.logger.error(`Failed to upload PDF to storage: ${error.message}`);
        throw error;
      }

      try {
        this.logger.log(`Sending receipt email to ${order.customer.email}`);
        await this.emailService.sendReceiptEmail({
          to: order.customer.email,
          customerName: order.customer.name,
          orderId: order.orderId,
          receiptId,
          total: Number(order.total),
          pdfBuffer: buffer,
        });
      } catch (error) {
        this.logger.error(`Failed to send receipt email: ${error.message}`);
        throw error;
      }

      const receipt = this.receiptRepository.create({
        receiptId,
        orderId: order.id,
        storageUrl: storageResult?.key,
        emailSentAt: new Date(),
        generatedAt: new Date(),
      });

      await this.receiptRepository.save(receipt);
      this.logger.log(`Receipt ${receiptId} saved to database`);

      this.cleanupFile(pdfPath);

      this.logger.log(
        `Receipt generation completed successfully for order ${order.orderId}`,
      );
      return { success: true, receiptId };
    } catch (error) {
      this.logger.error(
        `An unexpected error occurred while generating receipt for order ${orderId}\n${error.stack}`,
      );

      if (pdfPath) {
        await this.cleanupFile(pdfPath);
      }

      throw error;
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
