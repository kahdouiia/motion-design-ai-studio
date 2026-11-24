export type Station6Phase =
  | 'idle'
  | 'returning'
  | 'parsing'
  | 'rendered'
  | 'overview';

export type RenderStageId = 'dom' | 'css' | 'js';
export type RenderStageStatus = 'pending' | 'active' | 'done';

export interface RenderStageState {
  readonly id: RenderStageId;
  readonly token: string;
  readonly persianLabel: string;
  readonly accentColor: string;
  readonly status: RenderStageStatus;
  readonly progress: number;
}

export interface ArrivalShockwaveState {
  readonly index: number;
  readonly active: boolean;
  readonly radius: number;
  readonly opacity: number;
}

export interface Station6State {
  readonly frame: number;
  readonly phase: Station6Phase;
  readonly packetArrived: boolean;
  readonly arrivalGlow: number;
  readonly arrivalShockwaves: readonly ArrivalShockwaveState[];
  readonly linkUiScale: number;
  readonly stages: readonly RenderStageState[];
  readonly domProgress: number;
  readonly cssProgress: number;
  readonly jsProgress: number;
  readonly pageLoadBarProgress: number;
  readonly googlePageOpacity: number;
  readonly renderComplete: boolean;
  readonly overviewProgress: number;
}

export const STATION6_TIMELINE = {
  stationStart: 1890,
  packetArrivalStart: 2034,
  packetArrivedFrame: 2038,
  linkDismissEnd: 2052,
  domStart: 2042,
  domEnd: 2066,
  cssStart: 2060,
  cssEnd: 2084,
  jsStart: 2076,
  jsEnd: 2096,
  overviewStart: 2110,
  stationEnd: 2250,
} as const;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  const inv = 1 - c;
  return 1 - inv * inv * inv;
}

function buildStage(
  id: RenderStageId,
  token: string,
  persianLabel: string,
  accentColor: string,
  startFrame: number,
  endFrame: number,
  frame: number,
): RenderStageState {
  const progress = smoothstep(startFrame, endFrame, frame);
  let status: RenderStageStatus = 'pending';
  if (frame >= endFrame) {
    status = 'done';
  } else if (frame >= startFrame) {
    status = 'active';
  }
  return {
    id,
    token,
    persianLabel,
    accentColor,
    status,
    progress,
  };
}

export function getStation6State(frame: number): Station6State {
  const f = clamp(frame, 0, STATION6_TIMELINE.stationEnd);

  const packetArrived = f >= STATION6_TIMELINE.packetArrivedFrame;

  // Emerald pulse on the Smartphone port & screen as the 200 OK Packet arrives
  let arrivalGlow = 0;
  if (f >= STATION6_TIMELINE.packetArrivalStart && f <= 2090) {
    const rise = smoothstep(
      STATION6_TIMELINE.packetArrivalStart,
      2044,
      f,
    );
    const fall = 1 - smoothstep(2048, 2090, f);
    arrivalGlow = rise * fall;
  }

  // Two expanding emerald arrival shockwave rings around the Smartphone tap point
  const arrivalShockwaves: ArrivalShockwaveState[] = [0, 1].map((index) => {
    const ringStart = STATION6_TIMELINE.packetArrivalStart + index * 9;
    const duration = 38;
    const raw = (f - ringStart) / duration;
    const active = raw > 0 && raw < 1;
    const eased = easeOutCubic(clamp(raw, 0, 1));
    const radius = active ? 0.14 + eased * (0.82 + index * 0.22) : 0.14;
    const fadeIn = smoothstep(0, 0.14, clamp(raw, 0, 1));
    const fadeOut = 1 - smoothstep(0.28, 1, clamp(raw, 0, 1));
    return {
      index,
      active,
      radius,
      opacity: active ? clamp(fadeIn * fadeOut * 0.88, 0, 1) : 0,
    };
  });

  // Smoothly dismiss Station 1's 3D chain-link & tap-pill widgets as the page renders
  const linkUiScale =
    1 -
    smoothstep(
      STATION6_TIMELINE.packetArrivalStart,
      STATION6_TIMELINE.linkDismissEnd,
      f,
    );

  const domStage = buildStage(
    'dom',
    'DOM',
    'ساختار صفحه',
    '#1A5BFF',
    STATION6_TIMELINE.domStart,
    STATION6_TIMELINE.domEnd,
    f,
  );
  const cssStage = buildStage(
    'css',
    'CSS',
    'چیدمان و رنگ',
    '#0284C7',
    STATION6_TIMELINE.cssStart,
    STATION6_TIMELINE.cssEnd,
    f,
  );
  const jsStage = buildStage(
    'js',
    'JS',
    'تعامل و اجرا',
    '#10B981',
    STATION6_TIMELINE.jsStart,
    STATION6_TIMELINE.jsEnd,
    f,
  );

  const stages: readonly RenderStageState[] = [domStage, cssStage, jsStage];

  const pageLoadBarProgress = smoothstep(
    STATION6_TIMELINE.packetArrivedFrame,
    STATION6_TIMELINE.jsEnd,
    f,
  );

  const googlePageOpacity = smoothstep(
    STATION6_TIMELINE.packetArrivedFrame,
    STATION6_TIMELINE.domStart + 10,
    f,
  );

  const renderComplete = f >= STATION6_TIMELINE.jsEnd;
  const overviewProgress = smoothstep(
    STATION6_TIMELINE.overviewStart,
    STATION6_TIMELINE.stationEnd,
    f,
  );

  let phase: Station6Phase = 'idle';
  if (f >= STATION6_TIMELINE.overviewStart) {
    phase = 'overview';
  } else if (renderComplete) {
    phase = 'rendered';
  } else if (packetArrived) {
    phase = 'parsing';
  } else if (f >= STATION6_TIMELINE.stationStart) {
    phase = 'returning';
  }

  return {
    frame: f,
    phase,
    packetArrived,
    arrivalGlow,
    arrivalShockwaves,
    linkUiScale,
    stages,
    domProgress: domStage.progress,
    cssProgress: cssStage.progress,
    jsProgress: jsStage.progress,
    pageLoadBarProgress,
    googlePageOpacity,
    renderComplete,
    overviewProgress,
  };
}
