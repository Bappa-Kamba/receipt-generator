export interface ReceiptDto {
  receiptId: string;
  orderId: string;
  storageUrl: string | null;
  emailSentAt: Date | null;
  generatedAt: Date;
}
