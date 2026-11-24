import * as THREE from 'three';

export interface ScreenCanvasParams {
  readonly typedText: string;
  readonly cursorVisible: boolean;
  readonly searchBarHighlight: number;
  readonly tapImpactGlow: number;
}

const SCREEN_TEX_WIDTH = 512;
const SCREEN_TEX_HEIGHT = 800;

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function renderSmartphoneScreenCanvas(
  canvas: HTMLCanvasElement,
  params: ScreenCanvasParams,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  // Crisp luminous white-lavender ceramic screen background matching reference.png
  const bgGrad = ctx.createLinearGradient(0, 0, w * 0.25, h);
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.6, '#FBFBFF');
  bgGrad.addColorStop(1, '#F4F5FC');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle soft inner vignette around screen edges for tactile clay inset depth
  const edgeGrad = ctx.createRadialGradient(
    w * 0.5,
    h * 0.48,
    w * 0.32,
    w * 0.5,
    h * 0.5,
    h * 0.64,
  );
  edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
  edgeGrad.addColorStop(1, 'rgba(140, 145, 170, 0.09)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle radial blue glow behind tap point when tapped
  if (params.tapImpactGlow > 0.01) {
    const tapX = w * 0.72;
    const tapY = h * 0.61;
    const tapGlow = ctx.createRadialGradient(
      tapX,
      tapY,
      10,
      tapX,
      tapY,
      195,
    );
    tapGlow.addColorStop(
      0,
      `rgba(26, 91, 255, ${(0.22 * params.tapImpactGlow).toFixed(3)})`,
    );
    tapGlow.addColorStop(
      0.55,
      `rgba(77, 136, 255, ${(0.09 * params.tapImpactGlow).toFixed(3)})`,
    );
    tapGlow.addColorStop(1, 'rgba(77, 136, 255, 0)');
    ctx.fillStyle = tapGlow;
    ctx.fillRect(0, 0, w, h);
  }

  // Browser Search Bar Pill (positioned below front camera dot, matching reference.png)
  const barX = 36;
  const barY = 98;
  const barW = w - 72;
  const barH = 74;
  const barR = 37;

  // Soft outer highlight halo when typing/complete
  if (params.searchBarHighlight > 0.02) {
    ctx.save();
    drawRoundedRectPath(ctx, barX - 4, barY - 4, barW + 8, barH + 8, barR + 4);
    ctx.strokeStyle = `rgba(77, 136, 255, ${(0.24 * params.searchBarHighlight).toFixed(3)})`;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.restore();
  }

  // Pill interior
  drawRoundedRectPath(ctx, barX, barY, barW, barH, barR);
  ctx.fillStyle = '#F7F9FF';
  ctx.fill();

  // Crisp periwinkle-blue pill border matching reference.png
  ctx.lineWidth = 4.5;
  ctx.strokeStyle =
    params.searchBarHighlight > 0.4 ? '#4D88FF' : '#7D98EB';
  ctx.stroke();

  // Three pastel-blue browser dots on the left of the search bar (matching reference.png)
  const dotY = barY + barH / 2;
  const dotRadii = 8.5;
  const dotPositions = [barX + 32, barX + 58, barX + 84];
  dotPositions.forEach((dx, idx) => {
    ctx.beginPath();
    ctx.arc(dx, dotY, dotRadii, 0, Math.PI * 2);
    ctx.fillStyle = idx === 0 ? '#5D82EB' : idx === 1 ? '#7B9BF0' : '#9AB4F5';
    ctx.fill();
  });

  // Typed domain text ("google.com") in clean monospace inside the search bar
  const textStartX = barX + 114;
  const textY = barY + barH / 2 + 1;
  ctx.font =
    '700 32px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  if (params.typedText.length > 0) {
    ctx.fillStyle = '#1B1F3B';
    ctx.fillText(params.typedText, textStartX, textY);
  } else {
    ctx.fillStyle = 'rgba(90, 97, 128, 0.36)';
    ctx.fillText('https://', textStartX, textY);
  }

  // Deterministic typing caret
  if (params.cursorVisible) {
    const measuredWidth =
      params.typedText.length > 0
        ? ctx.measureText(params.typedText).width
        : 0;
    const caretX = textStartX + measuredWidth + 4;
    ctx.fillStyle = '#1A5BFF';
    drawRoundedRectPath(ctx, caretX, barY + 18, 4, barH - 36, 2);
    ctx.fill();
  }
}

export function createSmartphoneScreenTexture(): {
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = SCREEN_TEX_WIDTH;
  canvas.height = SCREEN_TEX_HEIGHT;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return {canvas, texture};
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.04,
      size / 2,
      size / 2,
      size * 0.48,
    );
    grad.addColorStop(0, 'rgba(116, 122, 156, 0.36)');
    grad.addColorStop(0.55, 'rgba(140, 145, 170, 0.14)');
    grad.addColorStop(1, 'rgba(140, 145, 170, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
