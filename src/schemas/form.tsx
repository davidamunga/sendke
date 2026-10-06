import type { PaymentForm } from "@/types/PaymentForm";
import { BUSINESS_NAME_MAX_LENGTH } from "@/data/poster-sizes";
import { z } from "zod";

export const formSchema = z
  .object({
    paymentType: z.enum(["SEND_MONEY", "PAYBILL", "TILL_NUMBER", "POCHI_LA_BIASHARA"]),
    phoneNumber: z.string().optional(),
    paybillNumber: z.string().optional(),
    accountNumber: z.string().optional(),
    tillNumber: z.string().optional(),
    name: z.string().optional(),
    businessName: z.string().max(BUSINESS_NAME_MAX_LENGTH).optional(),
    selectedColor: z.string(),
    showName: z.boolean(),
    showQrCode: z.boolean(),
    title: z.string().min(1, "Title cannot be empty"),
    fontScale: z.number().min(0.7).max(1.8),
  })
  .refine(
    (data) => {
      // Validation based on payment type
      if (["SEND_MONEY", "POCHI_LA_BIASHARA"].includes(data.paymentType)) {
        if (
          !data.phoneNumber ||
          data.phoneNumber.replace(/\s/g, "").length < 10
        ) {
          return false;
        }
        // If showName is true, name must not be empty
        if (data.showName && (!data.name || data.name.trim().length === 0)) {
          return false;
        }
      } else if (data.paymentType === "PAYBILL") {
        if (!data.paybillNumber || data.paybillNumber.trim().length === 0) {
          return false;
        }
        if (!data.accountNumber || data.accountNumber.trim().length === 0) {
          return false;
        }
      } else if (data.paymentType === "TILL_NUMBER") {
        if (!data.tillNumber || data.tillNumber.trim().length === 0) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Please fill in all required fields for the selected payment type",
      path: ["phoneNumber"],
    }
  );

export const FORM_DEFAULT_VALUES: PaymentForm = {
  paymentType: "SEND_MONEY",
  phoneNumber: "",
  paybillNumber: "",
  accountNumber: "",
  tillNumber: "",
  name: "",
  businessName: "",
  selectedColor: "#16a34a",
  showName: true,
  showQrCode: true,
  title: "SEND MONEY",
  fontScale: 1.0,
};
