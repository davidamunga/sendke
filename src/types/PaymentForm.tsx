export type PaymentType = "SEND_MONEY" | "PAYBILL" | "TILL_NUMBER" | "POCHI_LA_BIASHARA";

export interface PaymentForm {
  paymentType: PaymentType;
  phoneNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  tillNumber?: string;
  name?: string;
  businessName?: string;
  selectedColor: string;
  showName: boolean;
  showQrCode: boolean;
  title: string;
  fontScale: number;
}

