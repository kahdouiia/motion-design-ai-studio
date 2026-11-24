import * as THREE from 'three';
import type {Station6State} from '../../timeline/station6';

export interface ScreenCanvasParams {
  readonly typedText: string;
  readonly cursorVisible: boolean;
  readonly searchBarHighlight: number;
  readonly tapImpactGlow: number;
  readonly station6?: Station6State;
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

  // Station 6: Progressive DOM -> CSS -> JS Browser Rendering & Google Search Page
  const s6 = params.station6;
  if (s6 && s6.googlePageOpacity > 0.01) {
    const pageAlpha = s6.googlePageOpacity;
    ctx.save();
    ctx.globalAlpha = pageAlpha;

    // Clean luminous white browser viewport below the address bar
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, barY + barH + 14, w, h - (barY + barH + 14));

    // Upgrade the address bar cleanly to HTTPS padlock + https://google.com
    drawRoundedRectPath(ctx, barX, barY, barW, barH, barR);
    ctx.fillStyle = '#F2FBF7';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = s6.renderComplete ? '#10B981' : '#3B82F6';
    ctx.stroke();

    // Small crisp green HTTPS padlock icon inside left of address bar
    const lockX = barX + 34;
    const lockY = barY + barH / 2;
    ctx.strokeStyle = '#0D9468';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.arc(lockX, lockY - 6, 8, Math.PI, 0);
    ctx.stroke();
    drawRoundedRectPath(ctx, lockX - 11, lockY - 5, 22, 18, 4);
    ctx.fillStyle = '#10B981';
    ctx.fill();

    // HTTPS URL text
    ctx.font =
      '700 28px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    ctx.fillStyle = '#0B6E4F';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('https://google.com', barX + 62, lockY + 1);

    // Sweeping top page-load progress line right below address bar
    if (s6.pageLoadBarProgress > 0.01 && s6.pageLoadBarProgress < 0.995) {
      const progY = barY + barH + 12;
      ctx.fillStyle = '#E5EDFF';
      ctx.fillRect(barX, progY, barW, 5);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(barX, progY, barW * s6.pageLoadBarProgress, 5);
    }

    // Stage 1: DOM Tree Skeleton Wireframe (visible during DOM parse, fades as CSS paints)
    const skeletonAlpha =
      s6.domProgress * (1 - s6.cssProgress * 0.92) * pageAlpha;
    if (skeletonAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = skeletonAlpha;

      // Logo block skeleton
      drawRoundedRectPath(ctx, w / 2 - 110, 226, 220, 56, 16);
      ctx.fillStyle = '#E6EBF7';
      ctx.fill();

      // Search input skeleton
      drawRoundedRectPath(ctx, 44, 316, w - 88, 64, 32);
      ctx.fillStyle = '#EDF1FA';
      ctx.fill();
      ctx.strokeStyle = '#CBD5F0';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Button skeletons
      drawRoundedRectPath(ctx, 72, 404, 168, 42, 14);
      ctx.fillStyle = '#E6EBF7';
      ctx.fill();
      drawRoundedRectPath(ctx, 256, 404, 174, 42, 14);
      ctx.fillStyle = '#E6EBF7';
      ctx.fill();

      // DOM Tree hint badge (positioned left-of-cable for crisp readability)
      drawRoundedRectPath(ctx, 52, 476, 256, 44, 12);
      ctx.fillStyle = '#EEF3FF';
      ctx.fill();
      ctx.fillStyle = '#1A5BFF';
      ctx.font = '700 20px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Building DOM Tree...', 52 + 128, 498);
      ctx.restore();
    }

    // Stage 2 & 3: CSS Styled Google Search Page + JS Interactive Polish
    if (s6.cssProgress > 0.02) {
      const cssA = s6.cssProgress * pageAlpha;
      const slideUp = (1 - s6.cssProgress) * 18;
      ctx.save();
      ctx.globalAlpha = cssA;

      // Iconic 4-color Google Wordmark centered cleanly
      const letters = [
        {ch: 'G', color: '#4285F4'},
        {ch: 'o', color: '#EA4335'},
        {ch: 'o', color: '#FBBC05'},
        {ch: 'g', color: '#4285F4'},
        {ch: 'l', color: '#34A853'},
        {ch: 'e', color: '#EA4335'},
      ] as const;

      ctx.font = '700 84px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const widths = letters.map((l) => ctx.measureText(l.ch).width);
      const totalLogoWidth = widths.reduce((sum, item) => sum + item, 0);
      let cursorX = (w - totalLogoWidth) / 2;
      const logoY = 254 + slideUp;

      letters.forEach((l, idx) => {
        ctx.fillStyle = l.color;
        ctx.fillText(l.ch, cursorX, logoY);
        cursorX += widths[idx];
      });

      // Clean rounded Google Search input box with subtle elevation shadow
      const searchX = 40;
      const searchY = 320 + slideUp;
      const searchW = w - 80;
      const searchH = 66;

      ctx.save();
      ctx.shadowColor = 'rgba(27, 31, 59, 0.10)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      drawRoundedRectPath(ctx, searchX, searchY, searchW, searchH, 33);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.restore();

      drawRoundedRectPath(ctx, searchX, searchY, searchW, searchH, 33);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#DCE3F5';
      ctx.stroke();

      // Magnifying glass icon on left of search input
      const mgX = searchX + 34;
      const mgY = searchY + searchH / 2 - 2;
      ctx.strokeStyle = '#4285F4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mgX, mgY, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mgX + 7, mgY + 7);
      ctx.lineTo(mgX + 15, mgY + 15);
      ctx.stroke();

      // Subtle search placeholder with generous margin before right-side accent dots
      ctx.font = '500 22px "Inter", system-ui, sans-serif';
      ctx.fillStyle = '#6B7290';
      ctx.textAlign = 'left';
      ctx.fillText('Search Google...', searchX + 64, searchY + searchH / 2 + 1);

      // Right-side Google multi-color quick accent dots (voice/lens)
      const iconBaseX = searchX + searchW - 34;
      const iconCenterY = searchY + searchH / 2;
      ctx.beginPath();
      ctx.arc(iconBaseX, iconCenterY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#34A853';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(iconBaseX - 20, iconCenterY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FBBC05';
      ctx.fill();

      // Two crisp Google Search action buttons
      const btnY = 408 + slideUp;
      const btnH = 44;
      drawRoundedRectPath(ctx, 56, btnY, 188, btnH, 14);
      ctx.fillStyle = '#F4F6FC';
      ctx.fill();
      drawRoundedRectPath(ctx, 260, btnY, 196, btnH, 14);
      ctx.fillStyle = '#F4F6FC';
      ctx.fill();

      ctx.font = '600 20px "Inter", system-ui, sans-serif';
      ctx.fillStyle = '#3B4262';
      ctx.textAlign = 'center';
      ctx.fillText('Google Search', 56 + 94, btnY + btnH / 2 + 1);
      ctx.fillText("I'm Feeling Lucky", 260 + 98, btnY + btnH / 2 + 1);

      // Clean stylized quick-shortcut tiles kept left-of-cable for 100% visibility
      const tileY = 486 + slideUp;
      const tiles = [
        {x: 56, color: '#4285F4', label: 'Search'},
        {x: 194, color: '#EA4335', label: 'Maps'},
      ] as const;

      for (const tile of tiles) {
        drawRoundedRectPath(ctx, tile.x, tileY, 122, 108, 20);
        ctx.fillStyle = '#F8FAFF';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#E6ECFA';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tile.x + 61, tileY + 42, 20, 0, Math.PI * 2);
        ctx.fillStyle = tile.color;
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(tile.x + 61, tileY + 42, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '600 18px "Inter", system-ui, sans-serif';
        ctx.fillStyle = '#4B5270';
        ctx.textAlign = 'center';
        ctx.fillText(tile.label, tile.x + 61, tileY + 86);
      }

      // Stage 3: JS Interactive & Loaded Timing Pill aligned cleanly clear of the Data Cable
      if (s6.jsProgress > 0.05) {
        ctx.save();
        ctx.globalAlpha = s6.jsProgress * pageAlpha;
        const pillW = 264;
        const pillH = 48;
        const pillX = 56;
        const pillY = 636;

        drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, 24);
        ctx.fillStyle = '#ECFDF5';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#34D399';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pillX + 28, pillY + pillH / 2, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();

        ctx.font = '700 22px "JetBrains Mono", monospace';
        ctx.fillStyle = '#0B6E4F';
        ctx.textAlign = 'left';
        ctx.fillText('200 OK · 84 ms', pillX + 48, pillY + pillH / 2 + 1);
        ctx.restore();
      }

      ctx.restore();
    }

    ctx.restore();
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
