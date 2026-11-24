import type {Vec3} from './choreography';

export const STATION5_START_FRAME = 1530;
export const STATION5_END_FRAME = 1890;

export type ServerTierId = 'load-balancer' | 'app-server' | 'response-builder';
export type ServerTierStatus = 'idle' | 'active' | 'done';
export type ServerResponsePhase =
  | 'incoming'
  | 'processing'
  | 'building'
  | 'launched';

export interface ServerTierDefinition {
  readonly id: ServerTierId;
  readonly index: number;
  readonly shortCode: 'LB' | 'APP' | '200 OK';
  readonly persianName: string;
  /** World Y center of this server tier */
  readonly tierY: number;
  readonly startFrame: number;
  readonly endFrame: number;
}

export interface ServerTierState extends ServerTierDefinition {
  readonly status: ServerTierStatus;
  /** 0..1 luminous LED pulse intensity */
  readonly ledIntensity: number;
  /** 0..1 rear vent backlight intensity */
  readonly ventGlow: number;
  /** True once tier shifts to emerald 200 OK ready/launch glow */
  readonly isEmerald: boolean;
}

export interface ServerLaunchShockwave {
  readonly index: number;
  readonly progress: number;
  readonly radius: number;
  readonly opacity: number;
  readonly active: boolean;
}

export interface Station5State {
  readonly frame: number;
  readonly isStation5Active: boolean;
  readonly rackFloatY: number;
  readonly phase: ServerResponsePhase;
  readonly tiers: readonly ServerTierState[];
  readonly activeTierIndex: number | null;
  readonly intakeGlow: number;
  /** 0..1 glowing processing halo intensity while request is inside Server Rack */
  readonly processingCharge: number;
  /** 0..1 smooth scale for the traveling Packet (0 while docked inside Server Rack) */
  readonly packetDockScale: number;
  /** 0..1 emerald 200 OK payload assembly scale on the returning inbound Packet */
  readonly responsePayloadScale: number;
  readonly isResponseLaunched: boolean;
  readonly payloadAssetsReady: readonly {
    readonly code: 'HTML' | 'CSS' | 'JS';
    readonly ready: boolean;
    readonly color: string;
  }[];
  readonly launchShockwaves: readonly ServerLaunchShockwave[];
}

/**
 * Exact Data Cable piercing point on Tier 1's top surface (`y = -12.48`).
 * The Data Cable terminates invisibly inside Tier 1 at `[0, -13.0, 0.25]`.
 */
export const SERVER_TOP_PORT_POSITION: Vec3 = [0.139, -12.48, 0.267];
export const SERVER_RACK_CENTER: Vec3 = [0.08, -13.23, 0.16];

export const SERVER_TIERS: readonly ServerTierDefinition[] = [
  {
    id: 'load-balancer',
    index: 0,
    shortCode: 'LB',
    persianName: 'لودبالانسر',
    tierY: -12.69,
    startFrame: 1644,
    endFrame: 1684,
  },
  {
    id: 'app-server',
    index: 1,
    shortCode: 'APP',
    persianName: 'سرور پردازش',
    tierY: -13.11,
    startFrame: 1684,
    endFrame: 1726,
  },
  {
    id: 'response-builder',
    index: 2,
    shortCode: '200 OK',
    persianName: 'ساخت پاسخ',
    tierY: -13.53,
    startFrame: 1726,
    endFrame: 1766,
  },
] as const;

const PACKET_ABSORB_START = 1624;
const PACKET_ABSORB_END = 1644;
const RESPONSE_LAUNCH_START = 1766;
const RESPONSE_LAUNCH_END = 1782;

const SHOCKWAVE_STARTS = [1766, 1775] as const;
const SHOCKWAVE_DURATION = 44;

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

function seg(frame: number, start: number, end: number): number {
  if (end <= start) return frame >= end ? 1 : 0;
  return clamp((frame - start) / (end - start), 0, 1);
}

export function getStation5State(rawFrame: number): Station5State {
  const frame = Number.isFinite(rawFrame) ? Math.max(0, rawFrame) : 0;
  const isStation5Active =
    frame >= STATION5_START_FRAME && frame < STATION5_END_FRAME;
  const rackFloatY = Math.sin(frame * 0.038 + 0.7) * 0.02;

  const isResponseLaunched = frame >= RESPONSE_LAUNCH_START;

  // Intake glow right as the incoming blue Packet enters the Top Port (1618..1654)
  const intakeGlow =
    frame >= 1618 && frame <= 1654
      ? Math.sin(seg(frame, 1618, 1654) * Math.PI)
      : 0;

  // Packet smoothly dives into the Server Rack (1 -> 0) and pops back out as 200 OK (0 -> 1)
  let packetDockScale = 1;
  if (frame >= PACKET_ABSORB_START && frame < RESPONSE_LAUNCH_START) {
    packetDockScale = 1 - smoothstep(seg(frame, PACKET_ABSORB_START, PACKET_ABSORB_END));
  } else if (frame >= RESPONSE_LAUNCH_START && frame < RESPONSE_LAUNCH_END) {
    packetDockScale = easeOutCubic(
      seg(frame, RESPONSE_LAUNCH_START, RESPONSE_LAUNCH_END),
    );
  }

  // Processing energy charge hovering above the Top Port while inside the Server Rack
  let processingCharge = 0;
  if (frame >= PACKET_ABSORB_END - 4 && frame < RESPONSE_LAUNCH_START + 18) {
    const fadeIn = smoothstep(seg(frame, PACKET_ABSORB_END - 4, PACKET_ABSORB_END + 14));
    const fadeOut =
      1 - smoothstep(seg(frame, RESPONSE_LAUNCH_START - 2, RESPONSE_LAUNCH_START + 18));
    processingCharge = clamp(fadeIn * fadeOut, 0, 1);
  }

  // 3-Tier sequential LED & vent processing cascade
  const tiers: ServerTierState[] = SERVER_TIERS.map((tier) => {
    let status: ServerTierStatus = 'idle';
    let ledIntensity = 0.22;
    let ventGlow = 0.06;

    if (frame >= tier.endFrame) {
      status = 'done';
      const launchFlash =
        frame >= RESPONSE_LAUNCH_START && frame <= RESPONSE_LAUNCH_START + 30
          ? Math.sin(seg(frame, RESPONSE_LAUNCH_START, RESPONSE_LAUNCH_START + 30) * Math.PI) * 0.35
          : 0;
      ledIntensity = clamp(0.75 + launchFlash, 0, 1);
      ventGlow = clamp(0.42 + launchFlash * 0.8, 0, 1);
    } else if (frame >= tier.startFrame) {
      status = 'active';
      const localT = seg(frame, tier.startFrame, tier.endFrame);
      const pulse = 0.72 + 0.28 * Math.abs(Math.sin(localT * Math.PI * 2.5));
      ledIntensity = clamp(pulse, 0, 1);
      ventGlow = clamp(0.58 + 0.42 * Math.sin(localT * Math.PI), 0, 1);
    }

    // Tier 3 shifts emerald during response building; all 3 shift emerald at launch
    const isEmerald =
      isResponseLaunched ||
      (tier.id === 'response-builder' && frame >= tier.startFrame + 16);

    return {
      ...tier,
      status,
      ledIntensity,
      ventGlow,
      isEmerald,
    };
  });

  const activeTier = tiers.find((t) => t.status === 'active');
  const activeTierIndex = activeTier ? activeTier.index : null;

  let phase: ServerResponsePhase = 'incoming';
  if (frame >= RESPONSE_LAUNCH_START) {
    phase = 'launched';
  } else if (frame >= SERVER_TIERS[2].startFrame) {
    phase = 'building';
  } else if (frame >= SERVER_TIERS[0].startFrame) {
    phase = 'processing';
  }

  // Payload assets (HTML / CSS / JS) become ready across Tier 2 & Tier 3
  const payloadAssetsReady = [
    {code: 'HTML' as const, ready: frame >= 1705, color: '#1A5BFF'},
    {code: 'CSS' as const, ready: frame >= 1732, color: '#0284C7'},
    {code: 'JS' as const, ready: frame >= 1752, color: '#F59E0B'},
  ] as const;

  const responsePayloadScale =
    frame < RESPONSE_LAUNCH_START
      ? 0
      : easeOutCubic(seg(frame, RESPONSE_LAUNCH_START, RESPONSE_LAUNCH_END + 8));

  // Concentric emerald launch shockwave rings radiating from the Top Port
  const launchShockwaves: ServerLaunchShockwave[] = SHOCKWAVE_STARTS.map(
    (startFrame, index) => {
      const rawProgress = (frame - startFrame) / SHOCKWAVE_DURATION;
      if (rawProgress <= 0 || rawProgress >= 1) {
        return {
          index,
          progress: clamp(rawProgress, 0, 1),
          radius: 0.18,
          opacity: 0,
          active: false,
        };
      }
      const eased = easeOutCubic(rawProgress);
      const radius = 0.22 + eased * (1.05 + index * 0.24);
      const fadeIn = smoothstep(clamp(rawProgress / 0.14, 0, 1));
      const fadeOut = 1 - smoothstep(clamp((rawProgress - 0.28) / 0.72, 0, 1));
      const opacity = clamp(fadeIn * fadeOut * (0.92 - index * 0.16), 0, 1);

      return {
        index,
        progress: rawProgress,
        radius,
        opacity,
        active: opacity > 0.01,
      };
    },
  );

  return {
    frame,
    isStation5Active,
    rackFloatY,
    phase,
    tiers,
    activeTierIndex,
    intakeGlow,
    processingCharge,
    packetDockScale,
    responsePayloadScale,
    isResponseLaunched,
    payloadAssetsReady,
    launchShockwaves,
  };
}
