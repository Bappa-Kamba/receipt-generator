import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReceiptResponseDto, CreateOrderDto, OrderResponseDto } from '../dtos';
import { OrderService } from '../services/order.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createOrder(@Body() dto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.orderService.createOrder(dto);
  }

  @Get(':orderId/receipt')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get receipt for specific order' })
  @ApiParam({ name: 'orderId', description: 'Order identifier' })
  @ApiResponse({
    status: 200,
    description: 'Receipt details for order',
    type: ReceiptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order or receipt not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getOrderReceipt(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ): Promise<ReceiptResponseDto> {
    return this.orderService.getOrderReceipt(orderId, user);
  }

  @Get(':orderId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get order details by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order identifier' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ): Promise<OrderResponseDto> {
    return this.orderService.getOrder(orderId, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all orders (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of orders with pagination',
    schema: {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: { $ref: '#/components/schemas/OrderResponseDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllOrders(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.orderService.getAllOrders(user, pageNum, limitNum);
  }
}
