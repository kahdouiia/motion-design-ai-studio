import {
  evaluateDataCablePoint,
  getChoreographyState,
  type Vec3,
} from './choreography';

export const STATION4_START_FRAME = 1050;
export const STATION4_END_FRAME = 1530;

export type NetworkLayerId = 'application' | 'transport' | 'network' | 'link';
export type LayerStatus = 'idle' | 'active' | 'done';
export type IspRoutingPhase =
  | 'approaching'
  | 'encapsulating'
  | 'routing'
  | 'forwarded';

export interface NetworkLayerDefinition {
  readonly id: NetworkLayerId;
  readonly index: number;
  readonly code: 'APP' | 'TCP' | 'IP' | 'LINK';
  readonly badgeTitle: string;
  readonly englishName: string;
  readonly persianName: string;
  readonly headerToken: string;
  readonly plateY: number;
  readonly cableProgress: number;
  readonly cablePoint: Vec3;
  readonly ringColor: string;
  readonly ringGlow: string;
  readonly plateTint: string;
  readonly ringRadius: number;
}

export interface NetworkLayerState extends NetworkLayerDefinition {
  readonly status: LayerStatus;
  /** Smooth 0..1 progress of the Packet acquiring this layer's colored header ring */
  readonly ringAcquired: number;
  /** 0..1 luminous pulse peaking right as the Packet pierces the plate */
  readonly platePulse: number;
  /** 0..1 expanding horizontal encapsulation ripple across the plate (0 or 1 when inactive) */
  readonly rippleProgress: number;
}

export interface IspRouterDefinition {
  readonly id: 'isp-1' | 'isp-2' | 'isp-3';
  readonly index: number;
  readonly label: string;
  readonly position: Vec3;
  readonly cableProgress: number;
  readonly cablePoint: Vec3;
  readonly side: 'left' | 'right';
}

export interface IspRouterState extends IspRouterDefinition {
  readonly status: LayerStatus;
  /** 0..1 luminous activity pulse as the encapsulated Packet routes past */
  readonly activity: number;
  /** 0..1 routing relay pulse moving along the fiber arc */
  readonly relayPulse: number;
  /** 0..1 antenna signal ring expansion */
  readonly antennaWave: number;
}

export interface Station4State {
  readonly frame: number;
  readonly isStation4Active: boolean;
  readonly stackFloatY: number;
  readonly layers: readonly NetworkLayerState[];
  readonly encapsulatedCount: number;
  readonly activeLayerIndex: number | null;
  readonly routers: readonly IspRouterState[];
  readonly activeRouterIndex: number | null;
  readonly routersPassedCount: number;
  readonly routingPhase: IspRoutingPhase;
  /** True while the outbound Packet carries Station 4 encapsulation header rings */
  readonly showEncapsulationRings: boolean;
}

/** Shared horizontal center of the 4-plate vertical Layer Stack */
export const LAYER_STACK_CENTER_X = -0.22;
export const LAYER_STACK_CENTER_Z = 0.26;

const RAW_LAYERS: readonly Omit<NetworkLayerDefinition, 'cablePoint'>[] = [
  {
    id: 'application',
    index: 0,
    code: 'APP',
    badgeTitle: 'L4 · APP',
    englishName: 'Application',
    persianName: 'کاربرد (HTTP)',
    headerToken: 'HTTP/2',
    plateY: -4.18,
    cableProgress: 0.71145,
    ringColor: '#1A5BFF',
    ringGlow: '#3B82F6',
    plateTint: '#DBEAFE',
    ringRadius: 0.44,
  },
  {
    id: 'transport',
    index: 1,
    code: 'TCP',
    badgeTitle: 'L3 · TCP',
    englishName: 'Transport',
    persianName: 'انتقال (TCP)',
    headerToken: 'PORT 443',
    plateY: -4.9,
    cableProgress: 0.73868,
    ringColor: '#6D28D9',
    ringGlow: '#8B5CF6',
    plateTint: '#EDE9FE',
    ringRadius: 0.54,
  },
  {
    id: 'network',
    index: 2,
    code: 'IP',
    badgeTitle: 'L2 · IP',
    englishName: 'Network',
    persianName: 'شبکه (IP)',
    headerToken: 'IP HDR',
    plateY: -5.62,
    cableProgress: 0.76472,
    ringColor: '#0284C7',
    ringGlow: '#38BDF8',
    plateTint: '#E0F2FE',
    ringRadius: 0.64,
  },
  {
    id: 'link',
    index: 3,
    code: 'LINK',
    badgeTitle: 'L1 · LINK',
    englishName: 'Link',
    persianName: 'پیوند (MAC)',
    headerToken: 'FRAME',
    plateY: -6.34,
    cableProgress: 0.789,
    ringColor: '#059669',
    ringGlow: '#34D399',
    plateTint: '#D1FAE5',
    ringRadius: 0.74,
  },
] as const;

export const NETWORK_LAYERS: readonly NetworkLayerDefinition[] = RAW_LAYERS.map(
  (layer) => ({
    ...layer,
    cablePoint: evaluateDataCablePoint(layer.cableProgress),
  }),
);

const RAW_ROUTERS: readonly Omit<IspRouterDefinition, 'cablePoint'>[] = [
  {
    id: 'isp-1',
    index: 0,
    label: 'ISP-01',
    position: [-1.22, -7.06, 0.22],
    cableProgress: 0.81227,
    side: 'left',
  },
  {
    id: 'isp-2',
    index: 1,
    label: 'ISP-02',
    position: [1.46, -7.36, 0.24],
    cableProgress: 0.82263,
    side: 'right',
  },
] as const;

export const ISP_ROUTERS: readonly IspRouterDefinition[] = RAW_ROUTERS.map(
  (router) => ({
    ...router,
    cablePoint: evaluateDataCablePoint(router.cableProgress),
  }),
);

const PACKET_RETURN_START_FRAME = 1770;
const LAYER_WRAP_LEAD = 0.008;
const LAYER_WRAP_TRAIL = 0.018;
const LAYER_RIPPLE_SPAN = 0.032;
const ROUTER_WINDOW = 0.022;

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

export function getStation4State(rawFrame: number): Station4State {
  const frame = Number.isFinite(rawFrame) ? Math.max(0, rawFrame) : 0;
  const isStation4Active =
    frame >= STATION4_START_FRAME && frame < STATION4_END_FRAME;
  const stackFloatY = Math.sin(frame * 0.036 + 2.1) * 0.022;

  const choreography = getChoreographyState(frame);
  const isInbound = frame >= PACKET_RETURN_START_FRAME;
  // Once the outbound journey has reached Station 5 and started returning, keep
  // plates/routers in their completed state rather than rewinding backward.
  const effectiveOutboundProgress = isInbound ? 1 : choreography.packetProgress;

  const layers: NetworkLayerState[] = NETWORK_LAYERS.map((layer) => {
    const startP = layer.cableProgress - LAYER_WRAP_LEAD;
    const endP = layer.cableProgress + LAYER_WRAP_TRAIL;

    let status: LayerStatus = 'idle';
    let ringAcquired = 0;

    if (effectiveOutboundProgress >= endP) {
      status = 'done';
      ringAcquired = 1;
    } else if (effectiveOutboundProgress > startP) {
      status = 'active';
      ringAcquired = easeOutCubic(
        clamp((effectiveOutboundProgress - startP) / (endP - startP), 0, 1),
      );
    }

    // Plate luminous pulse peaks right as the Packet pierces the aperture
    const distFromPlate = Math.abs(
      effectiveOutboundProgress - layer.cableProgress,
    );
    const pulseWindow = 0.026;
    const platePulse =
      !isInbound && distFromPlate < pulseWindow
        ? Math.cos((distFromPlate / pulseWindow) * (Math.PI / 2)) ** 2
        : 0;

    // Horizontal encapsulation ripple expands outward right after crossing
    const rippleRaw =
      !isInbound &&
      effectiveOutboundProgress >= layer.cableProgress - 0.004 &&
      effectiveOutboundProgress <= layer.cableProgress + LAYER_RIPPLE_SPAN
        ? clamp(
            (effectiveOutboundProgress - (layer.cableProgress - 0.004)) /
              (LAYER_RIPPLE_SPAN + 0.004),
            0,
            1,
          )
        : 0;

    return {
      ...layer,
      status,
      ringAcquired,
      platePulse,
      rippleProgress: rippleRaw > 0 && rippleRaw < 1 ? rippleRaw : 0,
    };
  });

  const encapsulatedCount = layers.filter(
    (layer) => layer.ringAcquired >= 0.45,
  ).length;
  const activeLayer = layers.find((layer) => layer.status === 'active');
  const activeLayerIndex = activeLayer ? activeLayer.index : null;

  const routers: IspRouterState[] = ISP_ROUTERS.map((router) => {
    const startP = router.cableProgress - ROUTER_WINDOW * 0.75;
    const endP = router.cableProgress + ROUTER_WINDOW * 1.1;

    let status: LayerStatus = 'idle';
    let activity = 0;
    let relayPulse = 0;
    let antennaWave = 0;

    if (effectiveOutboundProgress >= endP) {
      status = 'done';
    } else if (effectiveOutboundProgress > startP) {
      status = 'active';
      const localT = clamp(
        (effectiveOutboundProgress - startP) / (endP - startP),
        0,
        1,
      );
      activity = Math.sin(localT * Math.PI);
      relayPulse = smoothstep(localT);
      antennaWave = easeOutCubic(localT);
    }

    return {
      ...router,
      status,
      activity: isInbound ? 0 : activity,
      relayPulse: isInbound ? 0 : relayPulse,
      antennaWave: isInbound ? 0 : antennaWave,
    };
  });

  const routersPassedCount = routers.filter((r) => r.status === 'done').length;
  const activeRouter = routers.find((r) => r.status === 'active');
  const activeRouterIndex = activeRouter ? activeRouter.index : null;

  const firstLayerStart = NETWORK_LAYERS[0].cableProgress - LAYER_WRAP_LEAD;
  const lastLayerEnd = NETWORK_LAYERS[3].cableProgress + LAYER_WRAP_TRAIL;
  const lastRouter = ISP_ROUTERS[ISP_ROUTERS.length - 1];
  const lastRouterEnd = lastRouter.cableProgress + ROUTER_WINDOW * 1.1;

  let routingPhase: IspRoutingPhase = 'approaching';
  if (effectiveOutboundProgress >= lastRouterEnd) {
    routingPhase = 'forwarded';
  } else if (effectiveOutboundProgress >= lastLayerEnd) {
    routingPhase = 'routing';
  } else if (effectiveOutboundProgress > firstLayerStart) {
    routingPhase = 'encapsulating';
  }

  const showEncapsulationRings =
    !isInbound && layers.some((layer) => layer.ringAcquired > 0.02);

  return {
    frame,
    isStation4Active,
    stackFloatY,
    layers,
    encapsulatedCount,
    activeLayerIndex,
    routers,
    activeRouterIndex,
    routersPassedCount,
    routingPhase,
    showEncapsulationRings,
  };
}
