import QRCode from "qrcode";
import { inkOn, POSTER_INK } from "@/utils/poster-ink";
import { getPosterLayout, type Rect } from "@/utils/poster-layout";
import { fitFontSize, wrapWords } from "@/utils/poster-text";
import type { PosterRenderParams } from "@/types/RenderPoster";


const TITLE_FONT = "CalSans, 'Saira Condensed', sans-serif";
const LABEL_FONT = "'Saira Condensed', sans-serif";
const NUMBER_FONT = "Teko, sans-serif";

async function ensurePosterFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load("600 120px CalSans"),
      document.fonts.load("700 80px 'Saira Condensed'"),
      document.fonts.load("700 180px Teko"),
    ]);
  } catch {
    // Canvas falls back to the next available face.
  }
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number,
  family: string
) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function measureAt(
  ctx: CanvasRenderingContext2D,
  weight: number,
  family: string
) {
  return (size: number, value: string) => {
    setFont(ctx, weight, size, family);
    return ctx.measureText(value).width;
  };
}

function fillCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  size: number,
  weight: number,
  family: string,
  color: string
) {
  setFont(ctx, weight, size, family);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2);
}

function fillWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  rect: Rect,
  startSize: number,
  minSize: number,
  weight: number,
  family: string,
  color: string,
  maxLines: number
) {
  const pad = rect.width * 0.08;
  const maxWidth = rect.width - pad * 2;
  const size = fitFontSize(
    text,
    maxWidth,
    startSize,
    minSize,
    measureAt(ctx, weight, family)
  );
  setFont(ctx, weight, size, family);
  const lines = wrapWords(
    text,
    maxWidth,
    (value) => ctx.measureText(value).width,
    maxLines
  );
  const lineHeight = size * 1.05;
  const block = lineHeight * lines.length;
  let y = rect.y + (rect.height - block) / 2 + lineHeight / 2;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const line of lines) {
    ctx.fillText(line, rect.x + rect.width / 2, y);
    y += lineHeight;
  }
}

export const renderPosterToCanvas = async (
  params: PosterRenderParams
): Promise<HTMLCanvasElement> => {
  const {
    selectedSize,
    selectedColor,
    paymentType,
    showName,
    showQrCode,
    title,
    fontScale,
    displayValues,
    businessName,
    brand: businessBrand
  } = params;

  await ensurePosterFonts();

  const canvas = document.createElement("canvas");
  const width = selectedSize.width;
  const height = selectedSize.height;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to get canvas context");
  }

  const layout = getPosterLayout({
    width,
    height,
    paymentType,
    showName,
    showQrCode,
    businessName,
  });
  const brand = selectedColor || "#16a34a";
  const titleInk = inkOn(brand);
  const shortSide = Math.min(width, height);

  ctx.fillStyle = POSTER_INK.frame;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = POSTER_INK.paper;
  ctx.fillRect(
    layout.sideInset,
    layout.topInset,
    width - layout.sideInset * 2,
    layout.contentHeight
  );

  ctx.fillStyle = brand;
  ctx.fillRect(
    layout.header.x,
    layout.header.y,
    layout.header.width,
    layout.header.height
  );

  ctx.fillStyle = POSTER_INK.frame;
  ctx.fillRect(
    layout.methodBar.x,
    layout.methodBar.y,
    layout.methodBar.width,
    layout.methodBar.height
  );

  ctx.fillStyle = POSTER_INK.paper;
  ctx.fillRect(
    layout.primaryValue.x,
    layout.primaryValue.y,
    layout.primaryValue.width,
    layout.primaryValue.height
  );

  if (layout.secondaryBar && layout.secondaryValue) {
    ctx.fillStyle = POSTER_INK.frame;
    ctx.fillRect(
      layout.secondaryBar.x,
      layout.secondaryBar.y,
      layout.secondaryBar.width,
      layout.secondaryBar.height
    );
    ctx.fillStyle = POSTER_INK.paper;
    ctx.fillRect(
      layout.secondaryValue.x,
      layout.secondaryValue.y,
      layout.secondaryValue.width,
      layout.secondaryValue.height
    );
  }

  const titleText = (title || layout.copy.method).toUpperCase();
  fillWrapped(
    ctx,
    titleText,
    layout.header,
    Math.round(layout.header.height * 0.46 * fontScale),
    Math.round(layout.header.height * 0.22),
    600,
    TITLE_FONT,
    titleInk,
    2
  );

  const methodLine = layout.copy.methodBarText;
  fillCentered(
    ctx,
    methodLine,
    layout.methodBar,
    fitFontSize(
      methodLine,
      layout.methodBar.width * 0.9,
      Math.round(layout.methodBar.height * 0.42),
      Math.round(layout.methodBar.height * 0.28),
      measureAt(ctx, 700, LABEL_FONT)
    ),
    700,
    LABEL_FONT,
    POSTER_INK.paper
  );

  const numberMin = Math.round(layout.numberRect.height * 0.28);
  fillCentered(
    ctx,
    displayValues.primaryValue,
    layout.numberRect,
    fitFontSize(
      displayValues.primaryValue,
      layout.numberRect.width * 0.9,
      Math.round(layout.numberRect.height * 0.72 * fontScale),
      numberMin,
      measureAt(ctx, 700, NUMBER_FONT)
    ),
    700,
    NUMBER_FONT,
    POSTER_INK.frame
  );

  if (layout.nameRect && displayValues.secondaryValue) {
    fillWrapped(
      ctx,
      displayValues.secondaryValue.toUpperCase(),
      layout.nameRect,
      Math.round(layout.nameRect.height * 0.5),
      Math.round(layout.nameRect.height * 0.28),
      700,
      LABEL_FONT,
      POSTER_INK.frame,
      2
    );
  }

  if (
    layout.secondaryBar &&
    layout.secondaryValue &&
    layout.copy.secondaryLabel
  ) {
    fillCentered(
      ctx,
      layout.copy.secondaryLabel,
      layout.secondaryBar,
      fitFontSize(
        layout.copy.secondaryLabel,
        layout.secondaryBar.width * 0.9,
        Math.round(layout.secondaryBar.height * 0.42),
        Math.round(layout.secondaryBar.height * 0.28),
        measureAt(ctx, 700, LABEL_FONT)
      ),
      700,
      LABEL_FONT,
      POSTER_INK.paper
    );
    fillCentered(
      ctx,
      displayValues.secondaryValue,
      layout.secondaryValue,
      fitFontSize(
        displayValues.secondaryValue,
        layout.secondaryValue.width * 0.9,
        Math.round(layout.secondaryValue.height * 0.55 * fontScale),
        Math.round(layout.secondaryValue.height * 0.28),
        measureAt(ctx, 700, NUMBER_FONT)
      ),
      700,
      NUMBER_FONT,
      POSTER_INK.frame
    );
  }

  if (showQrCode && layout.qr && layout.qrCaption && displayValues.qrData) {
    const caption = "SCAN HAPA";
    fillCentered(
      ctx,
      caption,
      layout.qrCaption,
      fitFontSize(
        caption,
        layout.qrCaption.width * 0.86,
        Math.round(layout.qrCaption.height * 0.7),
        Math.round(layout.qrCaption.height * 0.4),
        measureAt(ctx, 700, LABEL_FONT)
      ),
      700,
      LABEL_FONT,
      POSTER_INK.frame
    );

    const qrSize = layout.qr.width;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = qrSize;
    tempCanvas.height = qrSize;

    await new Promise<void>((resolve) => {
      QRCode.toCanvas(
        tempCanvas,
        displayValues.qrData,
        {
          width: qrSize,
          margin: 2,
          color: {
            dark: POSTER_INK.qrDark,
            light: POSTER_INK.qrLight,
          },
          errorCorrectionLevel: "H",
        },
        (error: Error | null | undefined) => {
          if (error) console.error("Error generating QR code:", error);
          resolve();
        }
      );
    });

    ctx.drawImage(tempCanvas, layout.qr.x, layout.qr.y, qrSize, qrSize);
  }

  if (layout.footer && businessName?.trim()) {
    fillWrapped(
      ctx,
      businessName.trim().toUpperCase(),
      layout.footer,
      Math.round(Math.max(layout.footer.height * 0.42, shortSide * 0.045)),
      Math.round(layout.footer.height * 0.28),
      700,
      LABEL_FONT,
      POSTER_INK.paper,
      2
    );
  }

  return canvas;
};
