import {
  DATA_CABLE_CONTROL_POINTS,
  evaluateDataCablePoint,
  type Vec3,
} from './choreography';

export const STATION2_START_FRAME = 240;
export const STATION2_END_FRAME = 660;
export const DNS_DOMAIN = 'google.com';
export const RESOLVED_IP = '142.250.185.78';

export type DnsHopId = 'root' | 'tld' | 'authoritative';
export type DnsHopStatus = 'idle' | 'querying' | 'resolved';

export interface DnsHopState {
  readonly id: DnsHopId;
  readonly label: string;
  readonly persianLabel: string;
  readonly status: DnsHopStatus;
  readonly activeGlow: number;
}

export interface Station2Ripple {
  readonly index: number;
  readonly progress: number;
  readonly radius: number;
  readonly opacity: number;
  readonly active: boolean;
}

export interface Station2State {
  readonly frame: number;
  readonly isStation2Active: boolean;
  readonly platformFloatY: number;
  readonly pinBounceY: number;
  readonly pinScale: number;
  readonly pinGlowIntensity: number;
  readonly topPillGlow: number;
  readonly bottomPillGlow: number;
  readonly queryBeamProgress: number;
  readonly resolverArcOpacity: number;
  readonly resolverPulseT: number;
  readonly hops: readonly DnsHopState[];
  readonly isResolved: boolean;
  readonly resolvedRevealProgress: number;
  readonly returnPulseProgress: number;
  readonly packetIpAttached: number;
  readonly packetIpBurstProgress: number;
  readonly ripples: readonly Station2Ripple[];
}

/**
 * Center of the floating rounded white DNS Platform at y = +5.
 * Positioned so its front-left rounded bevel sits cleanly beneath
 * `DATA_CABLE_CONTROL_POINTS[3]` (`[-0.35, 5.0, 0.35]`) while keeping
 * the 3D Map Pin unobstructed to the right of the waiting Packet.
 */
export const DNS_PLATFORM_POSITION: Vec3 = [0.46, 4.7, -0.38] as const;

export const DNS_CABLE_ANCHOR: Vec3 = DATA_CABLE_CONTROL_POINTS[3];

/**
 * World coordinate where the Packet pauses beside the DNS Platform (`progress = 0.28`,
 * frames `340..560`) while waiting for DNS resolution.
 */
export const DNS_PACKET_WAIT_POSITION: Vec3 = evaluateDataCablePoint(0.28);

/**
 * World position of the 3D Map Pin center above the DNS Platform.
 */
export const DNS_PIN_WORLD_POSITION: Vec3 = [
  DNS_PLATFORM_POSITION[0] - 0.34,
  DNS_PLATFORM_POSITION[1] + 0.78,
  DNS_PLATFORM_POSITION[2] + 0.08,
] as const;

const QUERY_BEAM_START = 335;
const QUERY_BEAM_END = 368;

const RESOLVER_ARC_FADE_IN_START = 325;
const RESOLVER_ARC_FADE_IN_END = 355;
const RESOLVER_ARC_FADE_OUT_START = 545;
const RESOLVER_ARC_FADE_OUT_END = 590;

const ROOT_START = 350;
const ROOT_RESOLVED = 378;
const TLD_START = 378;
const TLD_RESOLVED = 406;
const AUTH_START = 406;
const AUTH_RESOLVED = 434;

const RETURN_PULSE_START = 436;
const RETURN_PULSE_END = 515;

const PACKET_IP_ATTACH_START = 495;
const PACKET_IP_ATTACH_END = 532;
const PACKET_IP_BURST_START = 505;
const PACKET_IP_BURST_END = 545;

const RIPPLE_START_FRAMES = [428, 444] as const;
const RIPPLE_DURATION_FRAMES = 62;

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

function segmentProgress(frame: number, start: number, end: number): number {
  if (end <= start) return frame >= end ? 1 : 0;
  return clamp((frame - start) / (end - start), 0, 1);
}

function resolveHopStatus(
  frame: number,
  start: number,
  resolved: number,
): DnsHopStatus {
  if (frame < start) return 'idle';
  if (frame < resolved) return 'querying';
  return 'resolved';
}

export function getStation2State(rawFrame: number): Station2State {
  const frame = Number.isFinite(rawFrame) ? Math.max(0, rawFrame) : 0;
  const isStation2Active =
    frame >= STATION2_START_FRAME && frame < STATION2_END_FRAME;

  // Subtle deterministic clay levitation
  const platformFloatY = Math.sin(frame * 0.042 + 0.8) * 0.032;

  // Map Pin subtle welcome lift + resolution celebration pop
  const arrivalPop =
    frame >= 290 && frame <= 350
      ? Math.sin(segmentProgress(frame, 290, 350) * Math.PI) * 0.09
      : 0;
  const resolvePop =
    frame >= AUTH_RESOLVED && frame <= AUTH_RESOLVED + 46
      ? Math.sin(segmentProgress(frame, AUTH_RESOLVED, AUTH_RESOLVED + 46) * Math.PI) *
        0.13
      : 0;
  const pinBounceY =
    Math.sin(frame * 0.065) * 0.025 + arrivalPop + resolvePop;
  const pinScale = 1 + resolvePop * 0.45;

  // Incoming query beam from Packet into Map Pin
  const queryBeamProgress =
    frame >= QUERY_BEAM_START && frame <= QUERY_BEAM_END
      ? smoothstep(segmentProgress(frame, QUERY_BEAM_START, QUERY_BEAM_END))
      : frame > QUERY_BEAM_END && frame < AUTH_RESOLVED
        ? 1
        : 0;

  // 3-hop recursive DNS lookup status (Root -> .com TLD -> Authoritative NS)
  const rootStatus = resolveHopStatus(frame, ROOT_START, ROOT_RESOLVED);
  const tldStatus = resolveHopStatus(frame, TLD_START, TLD_RESOLVED);
  const authStatus = resolveHopStatus(frame, AUTH_START, AUTH_RESOLVED);

  const hops: readonly DnsHopState[] = [
    {
      id: 'root',
      label: 'Root (.)',
      persianLabel: 'سرور ریشه',
      status: rootStatus,
      activeGlow:
        rootStatus === 'idle'
          ? 0
          : rootStatus === 'querying'
            ? 0.65 + 0.35 * smoothstep(segmentProgress(frame, ROOT_START, ROOT_RESOLVED))
            : 1,
    },
    {
      id: 'tld',
      label: '.com TLD',
      persianLabel: 'دامنه سطح بالا',
      status: tldStatus,
      activeGlow:
        tldStatus === 'idle'
          ? 0
          : tldStatus === 'querying'
            ? 0.65 + 0.35 * smoothstep(segmentProgress(frame, TLD_START, TLD_RESOLVED))
            : 1,
    },
    {
      id: 'authoritative',
      label: 'Google NS',
      persianLabel: 'سرور گوگل',
      status: authStatus,
      activeGlow:
        authStatus === 'idle'
          ? 0
          : authStatus === 'querying'
            ? 0.65 + 0.35 * smoothstep(segmentProgress(frame, AUTH_START, AUTH_RESOLVED))
            : 1,
    },
  ];

  // Smooth visibility envelope for the 3D Resolver Arc above the DNS Platform
  const arcFadeIn = smoothstep(
    segmentProgress(frame, RESOLVER_ARC_FADE_IN_START, RESOLVER_ARC_FADE_IN_END),
  );
  const arcFadeOut =
    1 -
    smoothstep(
      segmentProgress(frame, RESOLVER_ARC_FADE_OUT_START, RESOLVER_ARC_FADE_OUT_END),
    );
  const resolverArcOpacity = arcFadeIn * arcFadeOut;

  // Glowing pulse traveling across the 3-hop Resolver Arc (0 -> 1 across frames 350..434)
  const resolverPulseT = smoothstep(
    segmentProgress(frame, ROOT_START, AUTH_RESOLVED),
  );

  const isResolved = frame >= AUTH_RESOLVED;
  const resolvedRevealProgress = easeOutCubic(
    segmentProgress(frame, AUTH_RESOLVED, AUTH_RESOLVED + 18),
  );

  // Horizontal pill bars light up: top pill during query, bottom pill upon IP resolution
  const topPillGlow =
    frame < QUERY_BEAM_START
      ? 0
      : frame < RESOLVER_ARC_FADE_OUT_END
        ? smoothstep(segmentProgress(frame, QUERY_BEAM_START, ROOT_START + 15))
        : 0.35;
  const bottomPillGlow = isResolved
    ? 0.35 +
      0.65 *
        resolvedRevealProgress *
        (1 - 0.55 * smoothstep(segmentProgress(frame, 550, 620)))
    : 0;

  const pinGlowIntensity =
    0.35 +
    0.3 * topPillGlow +
    0.55 *
      resolvedRevealProgress *
      (1 - 0.45 * smoothstep(segmentProgress(frame, 520, 610)));

  // Return pulse carrying 142.250.185.78 from Map Pin back into the waiting Packet
  const returnPulseProgress =
    frame >= RETURN_PULSE_START && frame <= RETURN_PULSE_END
      ? smoothstep(segmentProgress(frame, RETURN_PULSE_START, RETURN_PULSE_END))
      : 0;

  // Packet gains its glowing IP collar ring before departing at frame 560
  const packetIpAttached =
    frame < PACKET_IP_ATTACH_START
      ? 0
      : frame <= 1770
        ? easeOutCubic(
            segmentProgress(frame, PACKET_IP_ATTACH_START, PACKET_IP_ATTACH_END),
          )
        : 0;

  const packetIpBurstProgress =
    frame >= PACKET_IP_BURST_START && frame <= PACKET_IP_BURST_END
      ? segmentProgress(frame, PACKET_IP_BURST_START, PACKET_IP_BURST_END)
      : 0;

  // Concentric blue radar ripples radiating on the white platform around the Map Pin
  const ripples: Station2Ripple[] = RIPPLE_START_FRAMES.map((startFrame, index) => {
    const rawProgress = (frame - startFrame) / RIPPLE_DURATION_FRAMES;
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
    const radius = 0.2 + eased * (0.62 + index * 0.14);
    const fadeIn = smoothstep(clamp(rawProgress / 0.16, 0, 1));
    const fadeOut = 1 - smoothstep(clamp((rawProgress - 0.35) / 0.65, 0, 1));
    const opacity = clamp(fadeIn * fadeOut * (0.88 - index * 0.12), 0, 1);

    return {
      index,
      progress: rawProgress,
      radius,
      opacity,
      active: opacity > 0.01,
    };
  });

  return {
    frame,
    isStation2Active,
    platformFloatY,
    pinBounceY,
    pinScale,
    pinGlowIntensity,
    topPillGlow,
    bottomPillGlow,
    queryBeamProgress,
    resolverArcOpacity,
    resolverPulseT,
    hops,
    isResolved,
    resolvedRevealProgress,
    returnPulseProgress,
    packetIpAttached,
    packetIpBurstProgress,
    ripples,
  };
}
