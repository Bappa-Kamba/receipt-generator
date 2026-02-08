import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum ReceiptStatus {
  PENDING = 'PENDING',
  PDF_UPLOADED = 'PDF_UPLOADED',
  EMAIL_SENT = 'EMAIL_SENT',
  FAILED = 'FAILED',
}
@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receiptId: string;

  @Column('uuid', { unique: true })
  orderId: string;

  @Column({ nullable: true })
  storageUrl: string;

  @Column({ nullable: true })
  storageKey: string;

  @Column({ type: 'enum', enum: ReceiptStatus, default: ReceiptStatus.PENDING })
  status: ReceiptStatus;

  @Column({ type: 'text', nullable: true })
  lastError: string;

  @Column({ type: 'timestamp', nullable: true })
  emailSentAt: Date;

  @Column({ type: 'timestamp' })
  generatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Order, (order) => order.receipt)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}
