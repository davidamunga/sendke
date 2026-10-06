import type { PaymentType } from "@/types/PaymentForm";

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PosterOrientation = "landscape" | "portrait";

export type PosterSheet = "till" | "paybill" | "send-money";

export const POSTER_BORDER_SIZE = 8;

export function getOrientation(
  width: number,
  height: number
): PosterOrientation {
  return width / height >= 1.15 ? "landscape" : "portrait";
}

export function getPosterSheet(paymentType: PaymentType): PosterSheet {
  switch (paymentType) {
    case "TILL_NUMBER":
      return "till";
    case "PAYBILL":
      return "paybill";
    default:
      return "send-money";
  }
}

export function getMethodCopy(
  paymentType: PaymentType,
  showName: boolean
): {
  method: string;
  primaryLabel: string;
  methodBarText: string;
  secondaryLabel?: string;
} {
  switch (paymentType) {
    case "TILL_NUMBER":
      return {
        method: "BUY GOODS",
        primaryLabel: "TILL NUMBER",
        methodBarText: "BUY GOODS  ·  TILL NUMBER",
      };
    case "PAYBILL":
      return {
        method: "PAY BILL",
        primaryLabel: "PAYBILL NUMBER",
        methodBarText: "PAYBILL NUMBER",
        secondaryLabel: "ACCOUNT NUMBER",
      };
    default:
      return {
        method: "SEND MONEY",
        primaryLabel: "PHONE NUMBER",
        methodBarText: "PHONE NUMBER",
        secondaryLabel: showName ? "NAME" : undefined,
      };
  }
}

function insetRect(
  x: number,
  y: number,
  width: number,
  height: number
): Rect {
  return { x, y, width, height };
}

export function getPosterLayout({
  width,
  height,
  paymentType,
  showName,
  showQrCode = false,
  businessName,
}: {
  width: number;
  height: number;
  paymentType: PaymentType;
  showName: boolean;
  showQrCode?: boolean;
  businessName?: string;
}) {
  const orientation = getOrientation(width, height);
  const sheet = getPosterSheet(paymentType);
  const copy = getMethodCopy(paymentType, showName);
  const hasBusinessName = Boolean(businessName?.trim());
  const hasSecondaryField = paymentType === "PAYBILL";
  const hasNameInValue =
    ["SEND_MONEY", "POCHI_LA_BIASHARA"].includes(paymentType) && Boolean(showName);

  const shortSide = Math.min(width, height);
  const inset = Math.max(POSTER_BORDER_SIZE * 3, Math.round(shortSide * 0.03));
  const topInset = inset;
  const sideInset = inset;
  const bottomInset = hasBusinessName
    ? Math.max(Math.round(height * 0.12), Math.round(shortSide * 0.1))
    : inset;
  const gap = Math.max(10, Math.round(inset * 0.45));

  const contentX = sideInset;
  const contentY = topInset;
  const contentWidth = width - 2 * sideInset;
  const contentHeight = height - topInset - bottomInset;

  const headerHeight = Math.round(
    contentHeight * (hasSecondaryField ? 0.14 : 0.18)
  );
  const methodBarHeight = Math.round(contentHeight * 0.08);
  const bodyY = contentY + headerHeight + methodBarHeight;
  const bodyHeight = contentHeight - headerHeight - methodBarHeight;

  const qrPanelWidth =
    showQrCode && orientation === "landscape"
      ? Math.round(Math.min(bodyHeight * 0.9, contentWidth * 0.36))
      : 0;
  const qrPanelHeight =
    showQrCode && orientation === "portrait"
      ? Math.round(Math.min(contentWidth * 0.58, bodyHeight * 0.38))
      : 0;

  const textWidth =
    orientation === "landscape" && showQrCode
      ? contentWidth - qrPanelWidth - gap
      : contentWidth;
  const leftBodyHeight =
    orientation === "portrait" && showQrCode
      ? bodyHeight - qrPanelHeight - gap
      : bodyHeight;

  const secondaryBarHeight = hasSecondaryField
    ? Math.round(leftBodyHeight * 0.14)
    : 0;
  const secondaryValueHeight = hasSecondaryField
    ? Math.round(leftBodyHeight * 0.28)
    : 0;
  const primaryValueHeight =
    leftBodyHeight - secondaryBarHeight - secondaryValueHeight;

  const header = insetRect(contentX, contentY, contentWidth, headerHeight);
  const methodBar = insetRect(
    contentX,
    contentY + headerHeight,
    contentWidth,
    methodBarHeight
  );

  let y = bodyY;
  const primaryValue = insetRect(contentX, y, textWidth, primaryValueHeight);
  y += primaryValueHeight;

  let secondaryBar: Rect | undefined;
  let secondaryValue: Rect | undefined;
  if (hasSecondaryField) {
    secondaryBar = insetRect(contentX, y, textWidth, secondaryBarHeight);
    y += secondaryBarHeight;
    secondaryValue = insetRect(contentX, y, textWidth, secondaryValueHeight);
  }

  const nameRect = hasNameInValue
    ? insetRect(
        primaryValue.x,
        primaryValue.y + Math.round(primaryValue.height * 0.68),
        primaryValue.width,
        Math.round(primaryValue.height * 0.28)
      )
    : undefined;
  const numberRect = hasNameInValue
    ? insetRect(
        primaryValue.x,
        primaryValue.y,
        primaryValue.width,
        Math.round(primaryValue.height * 0.66)
      )
    : primaryValue;

  let qrPanel: Rect | undefined;
  let qr: Rect | undefined;
  let qrCaption: Rect | undefined;
  if (showQrCode) {
    if (orientation === "landscape") {
      qrPanel = insetRect(
        contentX + textWidth + gap,
        bodyY,
        qrPanelWidth,
        bodyHeight
      );
    } else {
      qrPanel = insetRect(
        contentX,
        bodyY + leftBodyHeight + gap,
        contentWidth,
        qrPanelHeight
      );
    }

    const captionHeight = Math.round(qrPanel.height * 0.14);
    qrCaption = insetRect(
      qrPanel.x,
      qrPanel.y + Math.round(qrPanel.height * 0.06),
      qrPanel.width,
      captionHeight
    );
    const qrPad = Math.round(Math.min(qrPanel.width, qrPanel.height) * 0.1);
    const qrSize = Math.max(
      48,
      Math.min(
        qrPanel.width - qrPad * 2,
        qrPanel.height - captionHeight - qrPad * 3
      )
    );
    qr = insetRect(
      qrPanel.x + Math.round((qrPanel.width - qrSize) / 2),
      qrCaption.y + qrCaption.height + qrPad,
      qrSize,
      qrSize
    );
  }

  const footer = hasBusinessName
    ? insetRect(0, height - bottomInset, width, bottomInset)
    : undefined;

  return {
    orientation,
    sheet,
    copy,
    hasBusinessName,
    hasSecondaryField,
    hasNameInValue,
    topInset,
    bottomInset,
    sideInset,
    contentHeight,
    contentWidth,
    header,
    methodBar,
    primaryValue,
    numberRect,
    nameRect,
    secondaryBar,
    secondaryValue,
    qrPanel,
    qr,
    qrCaption,
    footer,
  };
}
