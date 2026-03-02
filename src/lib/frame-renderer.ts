/**
 * Profile frame renderer — 100% client-side Canvas API.
 * Draws user photo center-cropped into a 1080×1080 canvas
 * with a Palestinian-flag-colored circular frame and a
 * gradient banner at the bottom with localized text.
 */

const SIZE = 1080;
const FRAME_WIDTH = 38;
const BANNER_HEIGHT = 150;

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

  // 3. Gradient banner at the bottom with text
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

  // Slight overlap (0.01 rad) eliminates hairline gaps between arcs
  const o = 0.01;

  // Draw back-to-front so overlap layers naturally
  const arcs: [string, number, number][] = [
    [FLAG_COLORS.left, Math.PI * 0.75 - o, Math.PI * 1.25 + o],
    [FLAG_COLORS.bottom, Math.PI * 0.25 - o, Math.PI * 0.75 + o],
    [FLAG_COLORS.right, -Math.PI * 0.25 - o, Math.PI * 0.25 + o],
    [FLAG_COLORS.top, -Math.PI * 0.75 - o, -Math.PI * 0.25 + o],
  ];

  for (const [color, start, end] of arcs) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  // Thin white inner ring for clean separation
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, SIZE / 2 - FRAME_WIDTH - 1.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.stroke();
}

function drawBanner(
  ctx: CanvasRenderingContext2D,
  stampText: string,
  locale: string,
) {
  const isRTL = RTL_LOCALES.has(locale);
  const gradTop = SIZE - BANNER_HEIGHT - 50;

  // Gradient overlay: transparent → dark (more polished than flat)
  const grad = ctx.createLinearGradient(0, gradTop, 0, SIZE);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.35, "rgba(0, 0, 0, 0.55)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, gradTop, SIZE, BANNER_HEIGHT + 50);

  // Text settings
  ctx.fillStyle = "#FFFFFF";
  ctx.textBaseline = "middle";
  ctx.direction = isRTL ? "rtl" : "ltr";
  ctx.textAlign = isRTL ? "right" : "left";

  const textX = isRTL ? SIZE - 52 : 52;
  const maxWidth = SIZE - 104;

  // Auto-scale stamp text to fit
  let stampFontSize = 46;
  ctx.font = `bold ${stampFontSize}px system-ui, -apple-system, sans-serif`;
  while (ctx.measureText(stampText).width > maxWidth && stampFontSize > 24) {
    stampFontSize -= 2;
    ctx.font = `bold ${stampFontSize}px system-ui, -apple-system, sans-serif`;
  }

  // Stamp text
  const stampY = SIZE - BANNER_HEIGHT * 0.6;
  ctx.fillText(stampText, textX, stampY, maxWidth);

  // URL — smaller, slightly faded
  const urlSize = Math.max(22, stampFontSize * 0.52);
  ctx.font = `600 ${urlSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("vote-palestine.com", textX, stampY + stampFontSize * 0.85, maxWidth);
}
