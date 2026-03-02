/**
 * Profile frame renderer — 100% client-side Canvas API.
 * Draws user photo center-cropped into a 1080×1080 canvas
 * with a Palestinian-flag-colored circular frame and a
 * semi-transparent banner at the bottom with localized text.
 */

const SIZE = 1080;
const FRAME_WIDTH = 40;
const BANNER_HEIGHT = 160;

// Palestinian flag colors (clockwise from top)
const FLAG_COLORS = {
  top: "#000000",    // black
  right: "#009736",  // green
  bottom: "#FFFFFF", // white
  left: "#EE2A35",   // red
} as const;

const RTL_LOCALES = new Set(["ar", "ur", "fa", "prs"]);

/**
 * Render the framed profile image onto a canvas.
 */
export function renderFrame(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  stampText: string,
  locale: string,
): void {
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  // 1. Draw center-cropped image
  drawCenterCrop(ctx, img);

  // 2. Draw circular frame with 4 flag-colored arcs
  drawCircularFrame(ctx);

  // 3. Draw semi-transparent banner at the bottom
  drawBanner(ctx, stampText, locale);
}

/**
 * Export canvas as PNG blob.
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
      "image/png",
    );
  });
}

// ── Internal helpers ──────────────────────────────────────

function drawCenterCrop(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const { naturalWidth: sw, naturalHeight: sh } = img;
  const scale = Math.max(SIZE / sw, SIZE / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  const dx = (SIZE - dw) / 2;
  const dy = (SIZE - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawCircularFrame(ctx: CanvasRenderingContext2D) {
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const radius = SIZE / 2 - FRAME_WIDTH / 2;

  ctx.lineWidth = FRAME_WIDTH;
  ctx.lineCap = "butt";

  // Four quadrants: top (black), right (green), bottom (white), left (red)
  const arcs: [string, number, number][] = [
    [FLAG_COLORS.top, -Math.PI * 0.75, -Math.PI * 0.25],    // top-left to top-right
    [FLAG_COLORS.right, -Math.PI * 0.25, Math.PI * 0.25],   // top-right to bottom-right
    [FLAG_COLORS.bottom, Math.PI * 0.25, Math.PI * 0.75],   // bottom-right to bottom-left
    [FLAG_COLORS.left, Math.PI * 0.75, Math.PI * 1.25],     // bottom-left to top-left
  ];

  for (const [color, start, end] of arcs) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.strokeStyle = color;
    ctx.stroke();
  }
}

function drawBanner(
  ctx: CanvasRenderingContext2D,
  stampText: string,
  locale: string,
) {
  const isRTL = RTL_LOCALES.has(locale);
  const bannerY = SIZE - BANNER_HEIGHT;

  // Semi-transparent dark overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, bannerY, SIZE, BANNER_HEIGHT);

  // Text settings
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  const dir = isRTL ? "rtl" : "ltr";
  const align = isRTL ? "right" : "left";
  ctx.direction = dir;
  ctx.textAlign = align;

  const textX = isRTL ? SIZE - 48 : 48;

  // Auto-scale stamp text to fit
  const maxWidth = SIZE - 96;
  let stampFontSize = 48;
  ctx.font = `bold ${stampFontSize}px system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(stampText).width > maxWidth && stampFontSize > 24) {
    stampFontSize -= 2;
    ctx.font = `bold ${stampFontSize}px system-ui, -apple-system, sans-serif`;
  }

  // Draw stamp text
  const stampY = bannerY + BANNER_HEIGHT * 0.38;
  ctx.fillText(stampText, textX, stampY, maxWidth);

  // Draw URL
  const urlFontSize = Math.max(24, stampFontSize * 0.55);
  ctx.font = `600 ${urlFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  const urlY = bannerY + BANNER_HEIGHT * 0.72;
  ctx.fillText("vote-palestine.com", textX, urlY, maxWidth);
}
