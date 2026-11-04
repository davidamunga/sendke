import { useCallback, useEffect, useRef, useState } from "react";
import {
  canvasToBlob,
  canShareFiles,
  getPosterFilename,
  printPosterBlob,
  sharePosterFile,
  triggerDownload,
  type ShareResult,
} from "@/utils/poster-export";
import {
  renderPosterToCanvas
} from "@/utils/poster-render";
import type { PosterRenderParams } from "@/types/RenderPoster";
import { renderPosterToSVG } from "@/utils/poster-render-svg";

export function usePosterImage(params: PosterRenderParams) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supportsShare, setSupportsShare] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useEffect(() => {
    const probe = new File(["x"], "poster.png", { type: "image/png" });
    setSupportsShare(canShareFiles(probe));
  }, []);

  const renderLatest = useCallback(async () => {
    // TODO: Implement actual brand instead of using the color
    if(paramsRef.current.selectedColor == "#16a34a"){
      return await renderPosterToSVG(paramsRef.current);
    }
    const canvas = await renderPosterToCanvas(paramsRef.current);
    return canvasToBlob(canvas);
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsRendering(true);

    const timer = window.setTimeout(async () => {
      try {
        const blob = await renderLatest();
        if (requestId !== requestIdRef.current) return;

        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError("Could not render poster");
      } finally {
        if (requestId === requestIdRef.current) setIsRendering(false);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [
    params.selectedSize.slug,
    params.selectedSize.width,
    params.selectedSize.height,
    params.selectedColor,
    params.paymentType,
    params.showName,
    params.showQrCode,
    params.title,
    params.fontScale,
    params.businessName,
    params.displayValues.primaryValue,
    params.displayValues.secondaryValue,
    params.displayValues.qrData,
    renderLatest,
  ]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const filenameFor = () =>
    getPosterFilename({
      paymentType: paramsRef.current.paymentType,
      primaryValue: paramsRef.current.displayValues.primaryValue,
      templateSlug: paramsRef.current.selectedSize.slug,
    });

  const download = useCallback(async () => {
    const blob = await renderLatest();
    triggerDownload(blob, filenameFor());
  }, [renderLatest]);

  const share = useCallback(async (): Promise<ShareResult> => {
    const blob = await renderLatest();
    return sharePosterFile(blob, filenameFor());
  }, [renderLatest]);

  const print = useCallback(async () => {
    const blob = await renderLatest();
    await printPosterBlob(blob);
  }, [renderLatest]);

  return { previewUrl, isRendering, error, supportsShare, download, share, print };
}
