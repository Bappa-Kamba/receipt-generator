export interface ReceiptDto {
  receiptId: string;
  orderId: string;
  storageKey: string | null;
  emailSentAt: Date | null;
  generatedAt: Date;
}
