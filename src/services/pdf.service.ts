import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { Order } from '../entities/order.entity';

export interface GeneratePdfResult {
  filePath: string;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  private formatCurrency(amount: number): string {
    return `N${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  async generateReceiptPdf(
    order: Order,
    receiptId: string,
  ): Promise<GeneratePdfResult> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, `${receiptId}.pdf`);
    const doc = new PDFDocument({ margin: 50 });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    this.generateHeader(doc);
    this.generateCustomerInformation(doc, order, receiptId);
    this.generateInvoiceTable(doc, order);
    this.generateFooter(doc, receiptId);

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        const buffer = Buffer.concat(buffers);
        this.logger.log(`PDF generated: ${filePath}`);
        resolve({ filePath });
      });
      writeStream.on('error', reject);
    });
  }

  private generateHeader(doc: PDFKit.PDFDocument) {
    doc
      .fontSize(20)
      .text('KamTech Store', 50, 45)
      .fontSize(10)
      .text('123 Commerce Street', 200, 50, { align: 'right' })
      .text('Tech City, TC 12345', 200, 65, { align: 'right' })
      .text('Phone: +234-12-3456-7890', 200, 80, { align: 'right' })
      .text('Email: support@kamtechstore.com', 200, 95, { align: 'right' })
      .moveDown();
  }

  private generateCustomerInformation(
    doc: typeof PDFDocument,
    order: Order,
    receiptId: string,
  ) {
    doc.fillColor('#444444').fontSize(20).text('Receipt', 50, 160);

    const customerInformationTop = 200;

    doc
      .fontSize(10)
      .text('Receipt ID:', 50, customerInformationTop)
      .font('Helvetica-Bold')
      .text(receiptId || 'N/A', 150, customerInformationTop)
      .font('Helvetica')
      .text('Order ID:', 50, customerInformationTop + 15)
      .text(order.orderId, 150, customerInformationTop + 15)
      .text('Order Date:', 50, customerInformationTop + 30)
      .text(
        new Date(order.orderDate).toLocaleDateString(),
        150,
        customerInformationTop + 30,
      )
      .text('Customer:', 50, customerInformationTop + 45)
      .text(order.customer?.name || 'N/A', 150, customerInformationTop + 45)
      .text('Email:', 50, customerInformationTop + 60)
      .text(order.customer?.email || 'N/A', 150, customerInformationTop + 60)
      .text('Payment Method:', 50, customerInformationTop + 75)
      .text(
        order.paymentMethod.replace('_', ' ').toUpperCase(),
        150,
        customerInformationTop + 75,
      )
      .moveDown();
  }

  private generateInvoiceTable(doc: typeof PDFDocument, order: Order) {
    const invoiceTableTop = 330;

    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      invoiceTableTop,
      'Item',
      'Quantity',
      'Unit Price',
      'Total',
    );
    this.generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    let position = invoiceTableTop + 30;
    order.orderItems.forEach((item) => {
      const itemTotal = item.quantity * Number(item.unitPrice);
      this.generateTableRow(
        doc,
        position,
        item.productName,
        item.quantity.toString(),
        this.formatCurrency(Number(item.unitPrice)),
        this.formatCurrency(itemTotal),
      );
      position += 25;
    });

    this.generateHr(doc, position);
    position += 10;

    this.generateTableRow(
      doc,
      position,
      '',
      '',
      'Subtotal:',
      this.formatCurrency(Number(order.subtotal)),
    );
    position += 20;

    this.generateTableRow(
      doc,
      position,
      '',
      '',
      'Tax:',
      this.formatCurrency(Number(order.tax)),
    );
    position += 20;

    this.generateTableRow(
      doc,
      position,
      '',
      '',
      'Discount:',
      this.formatCurrency(Number(order.discount)),
    );
    position += 20;

    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      'Total:',
      this.formatCurrency(Number(order.total)),
    );
    doc.font('Helvetica');
  }

  private generateFooter(doc: typeof PDFDocument, receiptId: string) {
    doc
      .fontSize(10)
      .text('Thank you for your business!', 50, 700, {
        align: 'center',
        width: 500,
      })
      .text(`Receipt ID: ${receiptId}`, 50, 715, {
        align: 'center',
        width: 500,
      });
  }

  private generateTableRow(
    doc: typeof PDFDocument,
    y: number,
    item: string,
    quantity: string,
    unitPrice: string,
    total: string,
  ) {
    doc
      .fontSize(10)
      .text(item, 50, y, { width: 250 })
      .text(quantity, 300, y, { width: 90, align: 'right' })
      .text(unitPrice, 390, y, { width: 90, align: 'right' })
      .text(total, 0, y, { align: 'right' });
  }

  private generateHr(doc: typeof PDFDocument, y: number) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
}
