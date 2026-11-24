export const FPS = 30;
export const DURATION_SECONDS = 75;
export const TOTAL_FRAMES = FPS * DURATION_SECONDS; // 2250
export const COMPOSITION_WIDTH = 1080;
export const COMPOSITION_HEIGHT = 1920;

export type Vec3 = readonly [number, number, number];
export type StationIndex = 1 | 2 | 3 | 4 | 5 | 6;
export type PacketDirection = 'outbound' | 'inbound';

export interface StationDefinition {
  readonly index: StationIndex;
  readonly id:
    | 'browser-cache'
    | 'dns-resolution'
    | 'tcp-tls-handshake'
    | 'network-layers-isp'
    | 'server-response'
    | 'browser-rendering';
  readonly startFrame: number;
  readonly endFrame: number;
  readonly anchorY: number;
  readonly persianTitle: string;
  readonly persianSubtitle: string;
  readonly technicalBadges: readonly string[];
}

export interface ChoreographyState {
  readonly frame: number;
  readonly normalizedTime: number;
  readonly stationIndex: StationIndex;
  readonly station: StationDefinition;
  readonly stationProgress: number;
  readonly cameraPosition: Vec3;
  readonly cameraLookAt: Vec3;
  readonly cameraFov: number;
  readonly packetProgress: number;
  readonly packetDirection: PacketDirection;
  readonly packetPosition: Vec3;
}

export const WORLD_BOUNDS = {
  minX: -12,
  maxX: 12,
  minY: -18,
  maxY: 18,
  minZ: -10,
  maxZ: 68,
  minFov: 30,
  maxFov: 60,
} as const;

export const STATIONS: readonly StationDefinition[] = [
  {
    index: 1,
    id: 'browser-cache',
    startFrame: 0,
    endFrame: 240,
    anchorY: 12,
    persianTitle: 'مرورگر و بررسی کش',
    persianSubtitle: 'ابتدا کش مرورگر و سیستم‌عامل برای آی‌پی دامنه بررسی می‌شود',
    technicalBadges: ['google.com', 'CACHE'],
  },
  {
    index: 2,
    id: 'dns-resolution',
    startFrame: 240,
    endFrame: 660,
    anchorY: 5,
    persianTitle: 'پیدا کردن آی‌پی با DNS',
    persianSubtitle: 'نام دامنه توسط Resolver به آدرس عددی سرور گوگل ترجمه می‌شود',
    technicalBadges: ['DNS', '142.250.185.78'],
  },
  {
    index: 3,
    id: 'tcp-tls-handshake',
    startFrame: 660,
    endFrame: 1050,
    anchorY: 0,
    persianTitle: 'اتصال امن TCP و TLS',
    persianSubtitle: 'اتصال پایدار برقرار شده و کلیدهای رمزنگاری HTTPS توافق می‌شوند',
    technicalBadges: ['TCP', 'TLS', 'HTTPS'],
  },
  {
    index: 4,
    id: 'network-layers-isp',
    startFrame: 1050,
    endFrame: 1530,
    anchorY: -6,
    persianTitle: 'لایه‌های شبکه و مسیریابی ISP',
    persianSubtitle: 'هدرهای هر لایه دور پکت پیچیده شده و از روترهای ISP عبور می‌کند',
    technicalBadges: ['APP', 'TCP', 'IP', 'LINK'],
  },
  {
    index: 5,
    id: 'server-response',
    startFrame: 1530,
    endFrame: 1890,
    anchorY: -13,
    persianTitle: 'سرور گوگل و ارسال پاسخ',
    persianSubtitle: 'لودبالانسر و سرور درخواست را پردازش کرده و پاسخ را برمی‌گردانند',
    technicalBadges: ['HTTP', '200 OK'],
  },
  {
    index: 6,
    id: 'browser-rendering',
    startFrame: 1890,
    endFrame: 2250,
    anchorY: 12,
    persianTitle: 'رندر صفحه در گوشی',
    persianSubtitle: 'پکت‌ها باز شده، درخت DOM ساخته می‌شود و صفحه گوگل نمایش می‌یابد',
    technicalBadges: ['DOM', 'HTML/CSS/JS'],
  },
] as const;

export const DATA_CABLE_CONTROL_POINTS: readonly Vec3[] = [
  [0.25, 12.0, 0.45],
  [0.95, 9.4, 0.55],
  [-0.85, 6.8, 0.45],
  [-0.35, 5.0, 0.35],
  [0.75, 2.5, 0.3],
  [0.0, 0.0, 0.25],
  [-0.75, -3.0, 0.3],
  [0.0, -6.0, 0.25],
  [0.8, -9.6, 0.35],
  [0.0, -13.0, 0.25],
] as const;

interface CameraKeyframe {
  readonly frame: number;
  readonly position: Vec3;
  readonly lookAt: Vec3;
  readonly fov: number;
}

const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  {frame: 0, position: [1.7, 12.6, 11.4], lookAt: [0.0, 11.7, 0.0], fov: 42},
  {frame: 200, position: [1.2, 12.1, 10.6], lookAt: [0.1, 11.4, 0.0], fov: 41},
  {frame: 240, position: [0.8, 10.6, 10.9], lookAt: [0.0, 9.7, 0.0], fov: 42},
  {frame: 330, position: [-1.5, 5.7, 11.2], lookAt: [0.0, 4.9, 0.0], fov: 42},
  {frame: 620, position: [0.7, 5.1, 10.8], lookAt: [0.0, 4.7, 0.0], fov: 42},
  {frame: 660, position: [1.1, 3.8, 10.8], lookAt: [0.0, 3.0, 0.0], fov: 42},
  {frame: 740, position: [1.8, 0.7, 10.8], lookAt: [0.0, -0.2, 0.0], fov: 42},
  {frame: 1010, position: [0.9, 0.1, 10.4], lookAt: [0.0, -0.4, 0.0], fov: 41},
  {frame: 1050, position: [-0.2, -1.6, 11.1], lookAt: [0.0, -2.5, 0.0], fov: 42},
  {frame: 1140, position: [-1.8, -5.0, 12.4], lookAt: [0.0, -6.1, 0.0], fov: 43},
  {frame: 1490, position: [-0.8, -6.8, 11.8], lookAt: [0.0, -7.2, 0.0], fov: 43},
  {frame: 1530, position: [0.3, -8.8, 11.7], lookAt: [0.0, -9.5, 0.0], fov: 42},
  {frame: 1620, position: [1.8, -11.7, 11.4], lookAt: [0.0, -13.0, 0.0], fov: 42},
  {frame: 1830, position: [1.1, -12.1, 11.0], lookAt: [0.0, -12.9, 0.0], fov: 42},
  {frame: 1890, position: [0.8, -8.5, 11.8], lookAt: [0.0, -8.2, 0.0], fov: 43},
  {frame: 1980, position: [-0.6, 3.0, 13.0], lookAt: [0.0, 3.2, 0.0], fov: 44},
  {frame: 2060, position: [1.3, 12.2, 10.8], lookAt: [0.0, 11.8, 0.0], fov: 42},
  {frame: 2110, position: [1.1, 12.0, 11.2], lookAt: [0.0, 11.6, 0.0], fov: 42},
  {frame: 2250, position: [0.0, -6.5, 66.0], lookAt: [0.0, -6.5, 0.0], fov: 52},
];

interface PacketKeyframe {
  readonly frame: number;
  readonly progress: number;
}

const PACKET_KEYFRAMES: readonly PacketKeyframe[] = [
  {frame: 0, progress: 0.0},
  {frame: 180, progress: 0.0},
  {frame: 240, progress: 0.2},
  {frame: 340, progress: 0.28},
  {frame: 560, progress: 0.28},
  {frame: 660, progress: 0.44},
  {frame: 760, progress: 0.48},
  {frame: 960, progress: 0.48},
  {frame: 1050, progress: 0.62},
  {frame: 1480, progress: 0.86},
  {frame: 1530, progress: 0.92},
  {frame: 1640, progress: 1.0},
  {frame: 1770, progress: 1.0},
  {frame: 1890, progress: 0.72},
  {frame: 2040, progress: 0.0},
  {frame: 2250, progress: 0.0},
];

const PACKET_RETURN_START_FRAME = 1770;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    if (value === Number.POSITIVE_INFINITY) return max;
    return min;
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function smoothstep(t: number): number {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function clampVec3ToBounds(v: Vec3): Vec3 {
  return [
    clamp(v[0], WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    clamp(v[1], WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
    clamp(v[2], WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ),
  ];
}

function resolveStation(clampedFrame: number): StationDefinition {
  for (let i = 0; i < STATIONS.length; i++) {
    const station = STATIONS[i];
    const isLast = i === STATIONS.length - 1;
    if (
      clampedFrame >= station.startFrame &&
      (isLast ? clampedFrame <= station.endFrame : clampedFrame < station.endFrame)
    ) {
      return station;
    }
  }
  return STATIONS[STATIONS.length - 1];
}

function interpolateCamera(clampedFrame: number): {
  position: Vec3;
  lookAt: Vec3;
  fov: number;
} {
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    const start = CAMERA_KEYFRAMES[i];
    const end = CAMERA_KEYFRAMES[i + 1];
    if (clampedFrame >= start.frame && clampedFrame <= end.frame) {
      const span = end.frame - start.frame;
      const rawT = span > 0 ? (clampedFrame - start.frame) / span : 0;
      const easedT = smoothstep(rawT);
      return {
        position: clampVec3ToBounds(lerpVec3(start.position, end.position, easedT)),
        lookAt: clampVec3ToBounds(lerpVec3(start.lookAt, end.lookAt, easedT)),
        fov: clamp(lerp(start.fov, end.fov, easedT), WORLD_BOUNDS.minFov, WORLD_BOUNDS.maxFov),
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return {
    position: clampVec3ToBounds(last.position),
    lookAt: clampVec3ToBounds(last.lookAt),
    fov: clamp(last.fov, WORLD_BOUNDS.minFov, WORLD_BOUNDS.maxFov),
  };
}

function interpolatePacketProgress(clampedFrame: number): number {
  for (let i = 0; i < PACKET_KEYFRAMES.length - 1; i++) {
    const start = PACKET_KEYFRAMES[i];
    const end = PACKET_KEYFRAMES[i + 1];
    if (clampedFrame >= start.frame && clampedFrame <= end.frame) {
      const span = end.frame - start.frame;
      const rawT = span > 0 ? (clampedFrame - start.frame) / span : 0;
      const easedT = smoothstep(rawT);
      return clamp(lerp(start.progress, end.progress, easedT), 0, 1);
    }
  }
  return 0;
}

function catmullRomComponent(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const v0 = (p2 - p0) * 0.5;
  const v1 = (p3 - p1) * 0.5;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * p1 - 2 * p2 + v0 + v1) * t3 +
    (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 +
    v0 * t +
    p1
  );
}

/**
 * Evaluates a point along the Continuous World Data Cable spline (`progress` in `0..1`).
 * Matches `THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)` using pure math.
 */
export function evaluateDataCablePoint(progress: number): Vec3 {
  const points = DATA_CABLE_CONTROL_POINTS;
  const clamped = clamp(progress, 0, 1);
  const segments = points.length - 1;
  const scaled = clamped * segments;
  const segIndex = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - segIndex;

  const p1 = points[segIndex];
  const p2 = points[segIndex + 1];

  const p0: Vec3 =
    segIndex > 0
      ? points[segIndex - 1]
      : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1], 2 * p1[2] - p2[2]];

  const p3: Vec3 =
    segIndex + 2 < points.length
      ? points[segIndex + 2]
      : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1], 2 * p2[2] - p1[2]];

  return clampVec3ToBounds([
    catmullRomComponent(localT, p0[0], p1[0], p2[0], p3[0]),
    catmullRomComponent(localT, p0[1], p1[1], p2[1], p3[1]),
    catmullRomComponent(localT, p0[2], p1[2], p2[2], p3[2]),
  ]);
}

export function getChoreographyState(frame: number): ChoreographyState {
  const clampedFrame = clamp(frame, 0, TOTAL_FRAMES);
  const station = resolveStation(clampedFrame);
  const stationSpan = station.endFrame - station.startFrame;
  const stationProgress =
    stationSpan > 0 ? clamp((clampedFrame - station.startFrame) / stationSpan, 0, 1) : 0;

  const {position: cameraPosition, lookAt: cameraLookAt, fov: cameraFov} =
    interpolateCamera(clampedFrame);

  const packetProgress = interpolatePacketProgress(clampedFrame);
  const packetDirection: PacketDirection =
    clampedFrame >= PACKET_RETURN_START_FRAME ? 'inbound' : 'outbound';
  const packetPosition = evaluateDataCablePoint(packetProgress);

  return {
    frame: clampedFrame,
    normalizedTime: clamp(clampedFrame / TOTAL_FRAMES, 0, 1),
    stationIndex: station.index,
    station,
    stationProgress,
    cameraPosition,
    cameraLookAt,
    cameraFov,
    packetProgress,
    packetDirection,
    packetPosition,
  };
}
