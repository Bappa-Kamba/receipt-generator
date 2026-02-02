import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receipt } from '../entities/receipt.entity';
import { User, UserRole } from '../entities/user.entity';
import { ReceiptDto } from '../dtos';
import { StorageService } from './storage.service';

@Injectable()
export class ReceiptService {
  constructor(
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    private storageService: StorageService,
  ) {}

  async getReceiptById(receiptId: string, user: User): Promise<ReceiptDto> {
    const receipt = await this.receiptRepository.findOne({
      where: { receiptId },
      relations: ['order'],
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptId} not found`);
    }

    if (user.role !== UserRole.ADMIN) {
      if (receipt.order.customerId !== user.id) {
        throw new ForbiddenException(`You can't access this receipt`);
      }
    }

    return this.mapToDto(receipt);
  }

  async getReceiptWithOrder(receiptId: string): Promise<Receipt | null> {
    return this.receiptRepository.findOne({
      where: { receiptId },
      relations: ['order', 'order.customer'],
    });
  }

  async getAllReceipts(
    user: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ receipts: ReceiptDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.order', 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .orderBy('receipt.createdAt', 'DESC');

    // Filter by customer email for non-admin users
    if (user.role !== UserRole.ADMIN) {
      queryBuilder.where('customer.email = :email', { email: user.email });
    }

    const [receipts, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      receipts: receipts.map((receipt) => this.mapToDto(receipt)),
      total,
      page,
      limit,
    };
  }

  private mapToDto(receipt: Receipt): ReceiptDto {
    let cloudinaryUrl = receipt.cloudinaryUrl;

    if (cloudinaryUrl) {
      const publicId = cloudinaryUrl
        .split('/')
        .slice(-2)
        .join('/')
        .split('.')[0];
      cloudinaryUrl = this.storageService.generateSignedUrl(publicId);
    }

    return {
      receiptId: receipt.receiptId,
      orderId: receipt.order?.orderId || '',
      cloudinaryUrl,
      emailSentAt: receipt.emailSentAt,
      generatedAt: receipt.generatedAt,
    };
  }
}
