import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

export interface SendReceiptEmailParams {
  to: string;
  customerName: string;
  orderId: string;
  receiptId: string;
  total: number;
  url?: string;
}


type EmailProvider = 'resend' | 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private provider: EmailProvider;
  private transporter: nodemailer.Transporter;
  private resend: Resend

  private fromEmail: string;
  private fromName: string;

  constructor(private configService: ConfigService) {
    const fromEmail =
      this.configService.get<string>('email.fromEmail') ||
      this.configService.get<string>('email.user') ||
      'support@kamtechstore.com';

    const fromName =
      this.configService.get<string>('email.fromName') || 'KamTech Store';

    this.fromEmail = fromEmail;
    this.fromName = fromName;

    const resendApiKey =
      this.configService.get<string>('email.resendApiKey') ||
      process.env.RESEND_API_KEY;

    if (resendApiKey) {
      this.provider = 'resend';
      this.resend = new Resend(resendApiKey);
      this.logger.log('Email provider: Resend');
      return;
    }

    const user = this.configService.get<string>('email.user');
    const password = this.configService.get<string>('email.password');

    if (!user || !password) {
      this.provider = 'nodemailer';
      this.logger.warn(
        'No RESEND_API_KEY and missing email.user/email.password. Email sending will fail.',
      );
      return;
    }

    this.provider = 'nodemailer';
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: password },
    });
    this.logger.log('Email provider: Nodemailer (Gmail)');
  }

  async sendReceiptEmail(params: SendReceiptEmailParams): Promise<void> {
    const { to, customerName, orderId, receiptId, total, url } = params;
    const emailBody = this.generateEmailTemplate(
          customerName,
          orderId,
          receiptId,
          total,
          url,
        )

    try {
      if (this.provider === 'resend') {
        if (!this.resend) throw new Error('Resend client not initialized');

        await this.resend.emails.send({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: [to],
          subject: `Your Receipt for Order ${orderId}`,
          html: emailBody,
        });

        this.logger.log(`[Resend] Receipt email sent to ${to} for order ${orderId}`);
        return;
      }
      
      if (!this.transporter) throw new Error('Nodemailer transporter not initialized');

      await this.transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject: `Your Receipt for Order ${orderId}`,
        html: emailBody,
      });

      this.logger.log(`[Nodemailer] Receipt email sent to ${to} for order ${orderId}`);
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
    url?: string,
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
                <p><strong>Total Amount:</strong> N${this.formatCurrency(total)}</p>
              </div>
              <p>Click <a href="${url}" style="color: #4CAF50; text-decoration: none; font-weight: bold;">here</a> to view your receipt.</p>
              <p>If link fails, copy and paste this into your browser:\n${url}</p>
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
