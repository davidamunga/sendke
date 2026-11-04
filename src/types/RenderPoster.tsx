
import type { PaymentType } from "@/types/PaymentForm";
import type { PosterSize } from "@/types/PosterSize";

export interface DisplayValues {
  primaryValue: string;
  secondaryValue: string;
  qrData: string;
}

export interface PosterRenderParams {
  selectedSize: PosterSize;
  selectedColor: string;
  paymentType: PaymentType;
  showName: boolean;
  showQrCode: boolean;
  title: string;
  fontScale: number;
  displayValues: DisplayValues;
  businessName?: string;
  brand?: "safaricom" | "airtel" | "equity" | "kcb" | "cooperative" | "ncba" | "kingdom"
}