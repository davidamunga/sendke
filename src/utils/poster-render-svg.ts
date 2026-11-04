import { getPosterLayout } from "@/utils/poster-layout";
import type { PosterRenderParams } from "@/types/RenderPoster";
import TEMPLATE from "@/assets/mpesa.svg?raw";

const CELL_WIDTH = 115;

type LayoutKey = "a" | "s" | "l" | "t";

const LAYOUTS: Record<LayoutKey, { viewWidth: number; maxw: number; tmax: number; up: number; tup: number }> = {
  a: { viewWidth: 1000, maxw: 880, tmax: 880, up: 1.25, tup: 1.2 },
  s: { viewWidth: 1000, maxw: 860, tmax: 860, up: 1, tup: 1 },
  l: { viewWidth: 2000, maxw: 1200, tmax: 1250, up: 1, tup: 1 },
  t: { viewWidth: 1080, maxw: 940, tmax: 960, up: 1.35, tup: 1.3 },
};

const pickLayout = (width: number, height: number): LayoutKey => {
  const r = width / height;
  if (r < 0.62) return "t";
  if (r >= 1.6) return "l";
  if (r >= 0.85) return "s";
  return "a";
};

const measureOffscreen = (svg: SVGElement, el: SVGTextContentElement): number => {
  const holder = document.createElement("div");
  holder.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden;";
  holder.appendChild(svg);
  document.body.appendChild(holder);
  let w = 0;
  try {
    w = el.getComputedTextLength();
  } catch {
  }
  document.body.removeChild(holder);
  holder.removeChild(svg);
  return w;
};

const buildPosterSVGElement = async (params: PosterRenderParams): Promise<SVGElement> => {
  const {
    selectedSize,
    paymentType,
    showName,
    showQrCode,
    title,
    displayValues,
    businessName,
  } = params;

  const { width, height } = selectedSize;

  const layout = getPosterLayout({
    width,
    height,
    paymentType,
    showName,
    showQrCode,
    businessName,
  });

  const titleText = (title || layout.copy.method).toUpperCase();
  const digits = (displayValues.primaryValue || "").replace(/\s/g, "");
  const name = (displayValues.secondaryValue || businessName || "").trim();

  const doc = new DOMParser().parseFromString(TEMPLATE, "image/svg+xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("mpesa.svg is not valid SVG");
  }
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
  const $ = (sel: string) => svg.querySelector(sel);

  const tTitle = $("#t-title") as SVGTextElement;
  const tDigits = $("#t-digits") as SVGTextElement;
  const tName = $("#t-name") as SVGTextElement;
  const plate = $("#c-plate") as SVGGElement;
  const grid = $("#c-plate .grid") as SVGRectElement;
  const nameBox = $("#c-plate .namebox") as SVGRectElement;

  tTitle.textContent = titleText;
  tDigits.textContent = digits;
  tName.textContent = name;

  const digitCount = Math.max(1, digits.length);
  const plateWidth = digitCount * CELL_WIDTH;
  grid.setAttribute("width", String(plateWidth));
  nameBox.setAttribute("width", String(plateWidth));

  const nameVisible = showName && name.length > 0;
  tName.setAttribute("x", String(plateWidth / 2));
  tName.setAttribute("text-anchor", "middle");
  if (nameVisible) {
    const available = Math.max(20, plateWidth - 36);
    const measured = measureOffscreen(svg, tName);
    if (measured > available) {
      tName.setAttribute("textLength", String(available));
      tName.setAttribute("lengthAdjust", "spacingAndGlyphs");
    }
  } else {
    tName.setAttribute("display", "none");
    nameBox.setAttribute("display", "none");
  }

  const key = pickLayout(width, height);
  const cfg = LAYOUTS[key];

  svg.querySelectorAll<SVGSVGElement>("svg.l").forEach((l) => {
    const isActive = l.classList.contains(`l-${key}`);
    l.style.cssText = isActive
      ? `display:block;overflow:visible;` +
        `--maxw:${cfg.maxw};--tmax:${cfg.tmax};--up:${cfg.up};--tup:${cfg.tup};` +
        `--tc:${titleText.length};--n:${digitCount};--nc:${name.length};`
      : "display:none;";
  });

  const margin = cfg.viewWidth * 0.06;
  const scale = Math.max(0.01, Math.min(cfg.up, (cfg.viewWidth - margin * 2) / plateWidth));
  plate.setAttribute("transform", `translate(${(-plateWidth * scale) / 2} 0) scale(${scale})`);

  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));

  svg.querySelectorAll("script").forEach((s) => s.remove());

  return svg;
};

export const renderPosterToSVG = async (params: PosterRenderParams): Promise<Blob> => {
  const svg = await buildPosterSVGElement(params);
  const markup = new XMLSerializer().serializeToString(svg);
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${markup}`], {
    type: "image/svg+xml;charset=utf-8",
  });
};