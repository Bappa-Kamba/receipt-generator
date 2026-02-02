import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendReceiptEmailParams {
  to: string;
  customerName: string;
  orderId: string;
  receiptId: string;
  total: number;
  pdfBuffer: Buffer;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.apiKey') || '';
    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('email.fromEmail') ||
      'support@kamtechstore.com';
    this.fromName =
      this.configService.get<string>('email.fromName') || 'KamTech Store';
  }

  async sendReceiptEmail(params: SendReceiptEmailParams): Promise<void> {
    const { to, customerName, orderId, receiptId, total, pdfBuffer } = params;

    try {
      await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject: `Your Receipt for Order ${orderId}`,
        html: this.generateEmailTemplate(
          customerName,
          orderId,
          receiptId,
          total,
        ),
        attachments: [
          {
            filename: `receipt-${receiptId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

      this.logger.log(`Receipt email sent to ${to} for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to send receipt email to ${to}`, error);
      throw error;
    }
  }

  private formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private generateEmailTemplate(
    customerName: string,
    orderId: string,
    receiptId: string,
    total: number,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .order-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for shopping with KamTech Store. Your order has been completed successfully.</p>
              <div class="order-details">
                <h3>Order Summary</h3>
                <p><strong>Order ID:</strong> ${orderId}</p>
                <p><strong>Receipt ID:</strong> ${receiptId}</p>
                <p><strong>Total Amount:</strong> $${this.formatCurrency(total)}</p>
              </div>
              <p>Please find your receipt attached to this email.</p>
              <p>If you have any questions, please don't hesitate to contact us at support@kamtechstore.com</p>
            </div>
            <div class="footer">
              <p>KamTech Store</p>
              <p>123 Commerce Street, Tech City, TC 12345</p>
              <p>Phone: +234-12-3456-7890</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
