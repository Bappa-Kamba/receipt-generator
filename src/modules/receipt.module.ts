import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Order } from '../entities/order.entity';
import { Receipt } from '../entities/receipt.entity';
import { Customer } from '../entities/customer.entity';
import { User } from '../entities/user.entity';
import { OrderItem } from '../entities/order-item.entity';
import {
  WebhookController,
  ReceiptController,
  OrderController,
} from '../controllers';
import {
  PdfService,
  EmailService,
  StorageService,
  WebhookService,
  ReceiptService,
  OrderService,
} from '../services';
import { ReceiptProcessor } from '../processors/receipt.processor';
import { EmailProcessor } from '../processors/email.processor';
import { QueueModule } from './queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Receipt, Customer, User, OrderItem]),
    QueueModule
  ],
  controllers: [WebhookController, ReceiptController, OrderController],
  providers: [
    PdfService,
    EmailService,
    StorageService,
    WebhookService,
    ReceiptService,
    OrderService,
    ReceiptProcessor,
    EmailProcessor,
  ],
})
export class ReceiptModule {}
