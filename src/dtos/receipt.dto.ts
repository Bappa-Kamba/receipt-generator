export interface ReceiptDto {
  receiptId: string;
  orderId: string;
  cloudinaryUrl: string | null;
  emailSentAt: Date | null;
  generatedAt: Date;
}
