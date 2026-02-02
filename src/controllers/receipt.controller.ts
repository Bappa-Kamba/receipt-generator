import {
  Controller,
  Get,
  Param,
  Query,
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
import { ReceiptResponseDto } from '../dtos';
import { ReceiptService } from '../services/receipt.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, User } from '../entities/user.entity';

@ApiTags('receipts')
@ApiBearerAuth()
@Controller('receipts')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all receipts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of receipts with pagination',
    schema: {
      type: 'object',
      properties: {
        receipts: {
          type: 'array',
          items: { $ref: '#/components/schemas/ReceiptResponseDto' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllReceipts(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.receiptService.getAllReceipts(user, pageNum, limitNum);
  }

  @Get(':receiptId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get receipt by ID' })
  @ApiParam({ name: 'receiptId', description: 'Receipt identifier' })
  @ApiResponse({
    status: 200,
    description: 'Receipt details',
    type: ReceiptResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Receipt not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getReceiptById(
    @Param('receiptId') receiptId: string,
    @CurrentUser() user: User,
  ): Promise<ReceiptResponseDto> {
    return this.receiptService.getReceiptById(receiptId, user);
  }
}
