import {DATA_CABLE_CONTROL_POINTS, type Vec3} from './choreography';

export const STATION1_START_FRAME = 0;
export const STATION1_END_FRAME = 240;
export const TARGET_DOMAIN = 'google.com';

export type CacheCheckStatus = 'idle' | 'checking' | 'miss';

export interface Station1RippleRing {
  readonly index: number;
  readonly progress: number;
  readonly radius: number;
  readonly opacity: number;
  readonly active: boolean;
}

export interface Station1State {
  readonly frame: number;
  readonly isStation1Active: boolean;
  readonly phoneEntranceProgress: number;
  readonly phoneFloatY: number;
  readonly phoneTiltOffset: number;
  readonly typedText: string;
  readonly typedCharCount: number;
  readonly isTypingComplete: boolean;
  readonly cursorVisible: boolean;
  readonly searchBarHighlight: number;
  readonly fingerVisible: boolean;
  readonly fingerApproach: number;
  readonly fingerPressDepth: number;
  readonly fingerLocalOffset: Vec3;
  readonly tapPillPress: number;
  readonly tapImpactGlow: number;
  readonly ripples: readonly Station1RippleRing[];
  readonly browserCacheStatus: CacheCheckStatus;
  readonly osCacheStatus: CacheCheckStatus;
  readonly cacheMissSummaryVisible: boolean;
  readonly packetLaunchCharge: number;
  readonly packetSpawnRingProgress: number;
}

export const SMARTPHONE_DIMENSIONS = {
  width: 2.04,
  height: 3.12,
  depth: 0.28,
  cornerRadius: 0.34,
  bevelThickness: 0.075,
  bevelSize: 0.065,
  screenWidth: 1.72,
  screenHeight: 2.66,
  screenCornerRadius: 0.22,
  screenFrontZ: 0.22,
} as const;

export const SMARTPHONE_ROTATION: Vec3 = [-0.04, 0.36, 0.055] as const;

/**
 * Local offset of the glowing blue tap target on the smartphone's front face.
 * Positioned slightly right and below screen center to match `reference.png`.
 */
export const SMARTPHONE_TAP_LOCAL_OFFSET: Vec3 = [0.38, -0.28, 0.24] as const;

/**
 * Pure XYZ intrinsic Euler rotation matching `THREE.Vector3.applyEuler(new THREE.Euler(rx, ry, rz, 'XYZ'))`.
 */
export function applyEulerXYZ(v: Vec3, rotation: Vec3): Vec3 {
  const [rx, ry, rz] = rotation;
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  const cz = Math.cos(rz);
  const sz = Math.sin(rz);

  // Matrix M = Rx * Ry * Rz (Three.js 'XYZ' Euler order)
  const m00 = cy * cz;
  const m01 = -cy * sz;
  const m02 = sy;

  const m10 = cx * sz + sx * sy * cz;
  const m11 = cx * cz - sx * sy * sz;
  const m12 = -sx * cy;

  const m20 = sx * sz - cx * sy * cz;
  const m21 = sx * cz + cx * sy * sz;
  const m22 = cx * cy;

  return [
    m00 * v[0] + m01 * v[1] + m02 * v[2],
    m10 * v[0] + m11 * v[1] + m12 * v[2],
    m20 * v[0] + m21 * v[1] + m22 * v[2],
  ];
}

const ROTATED_TAP_OFFSET = applyEulerXYZ(
  SMARTPHONE_TAP_LOCAL_OFFSET,
  SMARTPHONE_ROTATION,
);

export const TAP_WORLD_ANCHOR: Vec3 = DATA_CABLE_CONTROL_POINTS[0];

/**
 * Smartphone world position chosen so its tap point sits directly on
 * `DATA_CABLE_CONTROL_POINTS[0]` (`[0.25, 12.0, 0.45]`).
 */
export const SMARTPHONE_BASE_POSITION: Vec3 = [
  TAP_WORLD_ANCHOR[0] - ROTATED_TAP_OFFSET[0],
  TAP_WORLD_ANCHOR[1] - ROTATED_TAP_OFFSET[1],
  TAP_WORLD_ANCHOR[2] - ROTATED_TAP_OFFSET[2],
] as const;

export function computeSmartphoneTapWorldPosition(
  basePosition: Vec3 = SMARTPHONE_BASE_POSITION,
  rotation: Vec3 = SMARTPHONE_ROTATION,
): Vec3 {
  const rotated = applyEulerXYZ(SMARTPHONE_TAP_LOCAL_OFFSET, rotation);
  return [
    basePosition[0] + rotated[0],
    basePosition[1] + rotated[1],
    basePosition[2] + rotated[2],
  ];
}

const TYPING_START_FRAME = 10;
const TYPING_END_FRAME = 60;

const FINGER_ENTER_START = 56;
const FINGER_TOUCH_START = 88;
const FINGER_TAP_PEAK_START = 96;
const FINGER_TAP_HOLD_END = 124;
const FINGER_LIFT_END = 136;
const FINGER_EXIT_END = 172;

const RIPPLE_START_FRAMES = [96, 108, 120] as const;
const RIPPLE_DURATION_FRAMES = 58;

const BROWSER_CACHE_CHECK_START = 98;
const BROWSER_CACHE_MISS_FRAME = 116;
const OS_CACHE_CHECK_START = 116;
const OS_CACHE_MISS_FRAME = 144;

const LAUNCH_CHARGE_START = 152;
const LAUNCH_CHARGE_PEAK = 180;
const LAUNCH_CHARGE_END = 216;

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

function easeOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  const inv = 1 - c;
  return 1 - inv * inv * inv;
}

function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function segmentProgress(frame: number, start: number, end: number): number {
  if (end <= start) return frame >= end ? 1 : 0;
  return clamp((frame - start) / (end - start), 0, 1);
}

export function getStation1State(rawFrame: number): Station1State {
  const frame = Number.isFinite(rawFrame) ? Math.max(0, rawFrame) : 0;
  const isStation1Active = frame >= STATION1_START_FRAME && frame < STATION1_END_FRAME;

  // Soft spring-like entrance during the first 18 frames, settled afterward
  const phoneEntranceProgress = easeOutCubic(segmentProgress(frame, 0, 18));
  const phoneFloatY = Math.sin(frame * 0.045) * 0.035;
  const phoneTiltOffset = Math.sin(frame * 0.032) * 0.012;

  // Deterministic character-by-character typing of "google.com"
  const typingRaw = segmentProgress(frame, TYPING_START_FRAME, TYPING_END_FRAME);
  const typedCharCount =
    frame < TYPING_START_FRAME
      ? 0
      : Math.min(
          TARGET_DOMAIN.length,
          Math.floor(typingRaw * TARGET_DOMAIN.length + 1e-6),
        );
  const typedText = TARGET_DOMAIN.slice(0, typedCharCount);
  const isTypingComplete = typedCharCount === TARGET_DOMAIN.length;

  // Crisp deterministic cursor blink while typing and up to tap contact
  const cursorVisible =
    frame < FINGER_TAP_PEAK_START &&
    (typedCharCount < TARGET_DOMAIN.length || Math.floor(frame / 10) % 2 === 0);

  const searchBarHighlight = isTypingComplete
    ? 0.55 + 0.45 * (1 - segmentProgress(frame, TYPING_END_FRAME, TYPING_END_FRAME + 24))
    : typingRaw * 0.55;

  // 3D Finger approach, tap press, and graceful retraction off-right
  let fingerApproach = 0;
  let fingerPressDepth = 0;

  if (frame >= FINGER_ENTER_START && frame < FINGER_EXIT_END) {
    if (frame < FINGER_TOUCH_START) {
      fingerApproach = easeOutCubic(
        segmentProgress(frame, FINGER_ENTER_START, FINGER_TOUCH_START),
      );
    } else if (frame < FINGER_LIFT_END) {
      fingerApproach = 1;
    } else {
      fingerApproach =
        1 - easeInOutCubic(segmentProgress(frame, FINGER_LIFT_END, FINGER_EXIT_END));
    }

    if (frame >= FINGER_TOUCH_START && frame < FINGER_TAP_PEAK_START) {
      fingerPressDepth = smoothstep(
        segmentProgress(frame, FINGER_TOUCH_START, FINGER_TAP_PEAK_START),
      );
    } else if (frame >= FINGER_TAP_PEAK_START && frame <= FINGER_TAP_HOLD_END) {
      // Gentle settle micro-rebound while holding at tap impact
      const holdT = segmentProgress(frame, FINGER_TAP_PEAK_START, FINGER_TAP_HOLD_END);
      fingerPressDepth = 1 - 0.14 * smoothstep(holdT);
    } else if (frame > FINGER_TAP_HOLD_END && frame < FINGER_LIFT_END) {
      fingerPressDepth =
        0.86 * (1 - smoothstep(segmentProgress(frame, FINGER_TAP_HOLD_END, FINGER_LIFT_END)));
    }
  }

  const fingerVisible = fingerApproach > 0.005;
  const fingerLocalOffset: Vec3 = [
    (1 - fingerApproach) * 3.1,
    (1 - fingerApproach) * -0.18 + (1 - fingerPressDepth) * 0.04,
    0.58 * (1 - fingerApproach) + 0.12 * (1 - fingerPressDepth),
  ];

  // Tap pill response & luminous flare
  const tapPillPress = fingerPressDepth;
  const tapDecay =
    frame < FINGER_TAP_PEAK_START
      ? 0
      : 1 - smoothstep(segmentProgress(frame, FINGER_TAP_PEAK_START, 175));
  const tapImpactGlow = Math.max(fingerPressDepth * 0.9, tapDecay * 0.85);

  // Expanding concentric blue ripple rings
  const ripples: Station1RippleRing[] = RIPPLE_START_FRAMES.map((startFrame, index) => {
    const rawProgress = (frame - startFrame) / RIPPLE_DURATION_FRAMES;
    if (rawProgress <= 0 || rawProgress >= 1) {
      return {
        index,
        progress: clamp(rawProgress, 0, 1),
        radius: 0.12,
        opacity: 0,
        active: false,
      };
    }

    const eased = easeOutCubic(rawProgress);
    const radius = 0.16 + eased * (0.64 + index * 0.14);
    const fadeIn = smoothstep(clamp(rawProgress / 0.14, 0, 1));
    const fadeOut = 1 - smoothstep(clamp((rawProgress - 0.35) / 0.65, 0, 1));
    const opacity = clamp(fadeIn * fadeOut * (0.92 - index * 0.12), 0, 1);

    return {
      index,
      progress: rawProgress,
      radius,
      opacity,
      active: opacity > 0.01,
    };
  });

  // Deterministic Browser & OS local cache check (both miss before Packet launch at frame 180)
  const browserCacheStatus: CacheCheckStatus =
    frame < BROWSER_CACHE_CHECK_START
      ? 'idle'
      : frame < BROWSER_CACHE_MISS_FRAME
        ? 'checking'
        : 'miss';

  const osCacheStatus: CacheCheckStatus =
    frame < OS_CACHE_CHECK_START
      ? 'idle'
      : frame < OS_CACHE_MISS_FRAME
        ? 'checking'
        : 'miss';

  const cacheMissSummaryVisible = frame >= OS_CACHE_MISS_FRAME;

  // Packet launch charge builds after both local caches miss, peaking right at frame 180
  let packetLaunchCharge = 0;
  if (frame >= LAUNCH_CHARGE_START && frame <= LAUNCH_CHARGE_PEAK) {
    packetLaunchCharge = smoothstep(
      segmentProgress(frame, LAUNCH_CHARGE_START, LAUNCH_CHARGE_PEAK),
    );
  } else if (frame > LAUNCH_CHARGE_PEAK && frame < LAUNCH_CHARGE_END) {
    packetLaunchCharge =
      1 - smoothstep(segmentProgress(frame, LAUNCH_CHARGE_PEAK, LAUNCH_CHARGE_END));
  }

  const packetSpawnRingProgress =
    frame >= 176 && frame <= 212 ? segmentProgress(frame, 176, 212) : 0;

  return {
    frame,
    isStation1Active,
    phoneEntranceProgress,
    phoneFloatY,
    phoneTiltOffset,
    typedText,
    typedCharCount,
    isTypingComplete,
    cursorVisible,
    searchBarHighlight,
    fingerVisible,
    fingerApproach,
    fingerPressDepth,
    fingerLocalOffset,
    tapPillPress,
    tapImpactGlow,
    ripples,
    browserCacheStatus,
    osCacheStatus,
    cacheMissSummaryVisible,
    packetLaunchCharge,
    packetSpawnRingProgress,
  };
}
