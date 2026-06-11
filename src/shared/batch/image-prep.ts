import type { PreparedImage } from '../extraction/claude-client';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;
const THUMB_DIMENSION = 128;

export interface PreparedFile {
  forExtraction: PreparedImage;
  thumbnailDataUrl: string;
}

/**
 * Resize an image File via canvas to bounded dimensions and JPEG-encode it
 * for Claude vision, plus a smaller thumbnail data URL for the UI table.
 * Browser-only; relies on Image + canvas.
 */
export async function prepareImage(file: File): Promise<PreparedFile> {
  const bitmap = await loadImage(file);
  const { width, height } = bitmap;

  const mainScale = scaleToFit(width, height, MAX_DIMENSION);
  const thumbScale = scaleToFit(width, height, THUMB_DIMENSION);

  const main = drawToCanvas(bitmap, width * mainScale, height * mainScale);
  const thumb = drawToCanvas(bitmap, width * thumbScale, height * thumbScale);

  const mainDataUrl = main.toDataURL('image/jpeg', JPEG_QUALITY);
  const thumbDataUrl = thumb.toDataURL('image/jpeg', 0.7);

  return {
    forExtraction: {
      base64: stripDataUrlPrefix(mainDataUrl),
      mediaType: 'image/jpeg',
    },
    thumbnailDataUrl: thumbDataUrl,
  };
}

function scaleToFit(w: number, h: number, max: number): number {
  const longest = Math.max(w, h);
  return longest <= max ? 1 : max / longest;
}

function drawToCanvas(
  bitmap: ImageBitmap | HTMLImageElement,
  w: number,
  h: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function loadImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
