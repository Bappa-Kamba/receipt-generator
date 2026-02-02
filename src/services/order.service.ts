import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Receipt } from '../entities/receipt.entity';
import { Customer } from '../entities/customer.entity';
import { OrderItem } from '../entities/order-item.entity';
import { User, UserRole } from '../entities/user.entity';
import { ReceiptDto, CreateOrderDto, OrderResponseDto } from '../dtos';
import { StorageService } from './storage.service';
import { format } from 'date-fns';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private storageService: StorageService,
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<OrderResponseDto> {
    let customer = await this.customerRepository.findOne({
      where: { email: dto.customerEmail },
    });

    if (!customer) {
      customer = this.customerRepository.create({
        email: dto.customerEmail,
        name: dto.customerName,
      });
      await this.customerRepository.save(customer);
    }

    const orderId = `ORD-${format(new Date(), 'yyyyMMdd')}-${Date.now().toString().slice(-6)}`;
    const order = this.orderRepository.create({
      orderId,
      customer,
      subtotal: dto.subtotal,
      tax: dto.tax,
      discount: dto.discount || 0,
      total: dto.total,
      paymentMethod: dto.paymentMethod,
      status: OrderStatus.CONFIRMED,
      orderDate: new Date(),
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = dto.items.map((item) =>
      this.orderItemRepository.create({
        order: savedOrder,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    const completeOrder = await this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['customer', 'orderItems'],
    });

    if (!completeOrder) {
      throw new NotFoundException(
        `Order ${savedOrder.id} not found after creation`,
      );
    }

    return this.mapToOrderResponse(completeOrder);
  }

  async getOrderReceipt(orderId: string, user: User): Promise<ReceiptDto> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (user.role !== UserRole.ADMIN) {
      if (order.customer.id !== user.id) {
        throw new ForbiddenException('You cannot access this order');
      }
    }

    const receipt = await this.receiptRepository.findOne({
      where: { orderId: order.id },
      relations: ['order'],
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt for order ${orderId} not found`);
    }

    return this.mapToDto(receipt);
  }

  async getOrder(orderId: string, user: User): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['customer', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (user.role !== UserRole.ADMIN) {
      if (order.customer.id !== user.id) {
        throw new ForbiddenException('You cannot access this order');
      }
    }

    return this.mapToOrderResponse(order);
  }

  async getAllOrders(
    user: User,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ orders: OrderResponseDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .orderBy('order.createdAt', 'DESC');

    // Filter by customer email for non-admin users
    if (user.role !== UserRole.ADMIN) {
      queryBuilder.where('customer.email = :email', { email: user.email });
    }

    const [orders, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      orders: orders.map((order) => this.mapToOrderResponse(order)),
      total,
      page,
      limit,
    };
  }

  private mapToOrderResponse(order: Order): OrderResponseDto {
    return {
      id: order.id,
      orderId: order.orderId,
      customerEmail: order.customer.email,
      customerName: order.customer.name,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      discount: Number(order.discount),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      status: order.status,
      items: order.orderItems.map((item) => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      orderDate: order.orderDate,
      createdAt: order.createdAt,
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
