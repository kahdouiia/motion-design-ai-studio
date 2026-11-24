import {
  DATA_CABLE_CONTROL_POINTS,
  evaluateDataCablePoint,
  type Vec3,
} from './choreography';

export const STATION3_START_FRAME = 660;
export const STATION3_END_FRAME = 1050;

export type TcpStepId = 'syn' | 'syn-ack' | 'ack';
export type TcpStepStatus = 'idle' | 'active' | 'done';
export type TlsStatus = 'waiting' | 'handshaking' | 'locked';

export interface TcpHandshakeStep {
  readonly id: TcpStepId;
  readonly label: string;
  readonly directionArrow: '↓' | '↑';
  readonly status: TcpStepStatus;
  readonly progress: number;
}

export interface TcpPulseVisual {
  readonly active: boolean;
  readonly stepId: TcpStepId | null;
  readonly direction: 'down' | 'up';
  readonly cableProgress: number;
  readonly position: Vec3;
  readonly intensity: number;
}

export interface Station3Shockwave {
  readonly index: number;
  readonly progress: number;
  readonly radius: number;
  readonly opacity: number;
  readonly active: boolean;
}

export interface Station3State {
  readonly frame: number;
  readonly isStation3Active: boolean;
  readonly gateFloatY: number;
  readonly innerRingSpin: number;
  readonly tcpSteps: readonly TcpHandshakeStep[];
  readonly tcpEstablished: boolean;
  readonly activePulse: TcpPulseVisual;
  readonly gateImpactGlow: number;
  readonly tlsStatus: TlsStatus;
  readonly keyExchangeProgress: number;
  readonly shackleCloseProgress: number;
  readonly padlockSnapBounce: number;
  readonly isTlsLocked: boolean;
  readonly tlsTunnelProgress: number;
  readonly packetTlsEncrypted: number;
  readonly shockwaves: readonly Station3Shockwave[];
}

export const SECURITY_GATE_POSITION: Vec3 = DATA_CABLE_CONTROL_POINTS[5]; // [0, 0, 0.25]
export const TCP_PACKET_CABLE_PROGRESS = 0.48;
export const TCP_GATE_CABLE_PROGRESS = 5 / 9; // ~0.5556 (DATA_CABLE_CONTROL_POINTS[5])

const SYN_START = 724;
const SYN_END = 758;
const SYN_ACK_START = 758;
const SYN_ACK_END = 792;
const ACK_START = 792;
const ACK_END = 824;

const TLS_KEY_EXCHANGE_START = 824;
const TLS_KEY_EXCHANGE_END = 846;

const SHACKLE_CLOSE_START = 826;
const SHACKLE_CLOSE_END = 846;

const TUNNEL_EXPAND_START = 842;
const TUNNEL_EXPAND_END = 905;

const PACKET_ENCRYPT_START = 875;
const PACKET_ENCRYPT_END = 930;

const SHOCKWAVE_START_FRAMES = [844, 852] as const;
const SHOCKWAVE_DURATION_FRAMES = 46;

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

function resolveTcpStep(
  frame: number,
  id: TcpStepId,
  label: string,
  directionArrow: '↓' | '↑',
  start: number,
  end: number,
): TcpHandshakeStep {
  if (frame < start) {
    return {id, label, directionArrow, status: 'idle', progress: 0};
  }
  if (frame < end) {
    return {
      id,
      label,
      directionArrow,
      status: 'active',
      progress: smoothstep(segmentProgress(frame, start, end)),
    };
  }
  return {id, label, directionArrow, status: 'done', progress: 1};
}

export function getStation3State(rawFrame: number): Station3State {
  const frame = Number.isFinite(rawFrame) ? Math.max(0, rawFrame) : 0;
  const isStation3Active =
    frame >= STATION3_START_FRAME && frame < STATION3_END_FRAME;

  const gateFloatY = Math.sin(frame * 0.04 + 1.4) * 0.028;

  // TCP 3-way handshake steps: SYN (↓) -> SYN-ACK (↑) -> ACK (↓)
  const synStep = resolveTcpStep(frame, 'syn', 'SYN', '↓', SYN_START, SYN_END);
  const synAckStep = resolveTcpStep(
    frame,
    'syn-ack',
    'SYN-ACK',
    '↑',
    SYN_ACK_START,
    SYN_ACK_END,
  );
  const ackStep = resolveTcpStep(frame, 'ack', 'ACK', '↓', ACK_START, ACK_END);
  const tcpSteps: readonly TcpHandshakeStep[] = [synStep, synAckStep, ackStep];
  const tcpEstablished = frame >= ACK_END;

  // Active TCP pulse traveling along the Data Cable between Packet (0.48) and Gate (0.556)
  let activePulse: TcpPulseVisual = {
    active: false,
    stepId: null,
    direction: 'down',
    cableProgress: TCP_PACKET_CABLE_PROGRESS,
    position: evaluateDataCablePoint(TCP_PACKET_CABLE_PROGRESS),
    intensity: 0,
  };

  if (synStep.status === 'active') {
    const cableProgress =
      TCP_PACKET_CABLE_PROGRESS +
      (TCP_GATE_CABLE_PROGRESS - TCP_PACKET_CABLE_PROGRESS) * synStep.progress;
    activePulse = {
      active: true,
      stepId: 'syn',
      direction: 'down',
      cableProgress,
      position: evaluateDataCablePoint(cableProgress),
      intensity: Math.sin(synStep.progress * Math.PI),
    };
  } else if (synAckStep.status === 'active') {
    const cableProgress =
      TCP_GATE_CABLE_PROGRESS +
      (TCP_PACKET_CABLE_PROGRESS - TCP_GATE_CABLE_PROGRESS) * synAckStep.progress;
    activePulse = {
      active: true,
      stepId: 'syn-ack',
      direction: 'up',
      cableProgress,
      position: evaluateDataCablePoint(cableProgress),
      intensity: Math.sin(synAckStep.progress * Math.PI),
    };
  } else if (ackStep.status === 'active') {
    const cableProgress =
      TCP_PACKET_CABLE_PROGRESS +
      (TCP_GATE_CABLE_PROGRESS - TCP_PACKET_CABLE_PROGRESS) * ackStep.progress;
    activePulse = {
      active: true,
      stepId: 'ack',
      direction: 'down',
      cableProgress,
      position: evaluateDataCablePoint(cableProgress),
      intensity: Math.sin(ackStep.progress * Math.PI),
    };
  }

  // Gate impact flare right as SYN arrives (~758) and ACK arrives (~824)
  const synImpact =
    frame >= SYN_END - 4 && frame <= SYN_END + 16
      ? Math.sin(segmentProgress(frame, SYN_END - 4, SYN_END + 16) * Math.PI) * 0.7
      : 0;
  const ackImpact =
    frame >= ACK_END - 4 && frame <= ACK_END + 20
      ? Math.sin(segmentProgress(frame, ACK_END - 4, ACK_END + 20) * Math.PI) * 0.9
      : 0;
  const gateImpactGlow = Math.max(synImpact, ackImpact);

  // TLS Handshake & Padlock Shackle Closing
  const keyExchangeProgress = smoothstep(
    segmentProgress(frame, TLS_KEY_EXCHANGE_START, TLS_KEY_EXCHANGE_END),
  );
  const shackleCloseProgress = easeInOutCubic(
    segmentProgress(frame, SHACKLE_CLOSE_START, SHACKLE_CLOSE_END),
  );
  const isTlsLocked = frame >= SHACKLE_CLOSE_END;

  const tlsStatus: TlsStatus =
    frame < TLS_KEY_EXCHANGE_START
      ? 'waiting'
      : frame < SHACKLE_CLOSE_END
        ? 'handshaking'
        : 'locked';

  // Tactile snap rebound on the padlock body right as the shackle closes (frames 845..866)
  const padlockSnapBounce =
    frame >= SHACKLE_CLOSE_END - 1 && frame <= SHACKLE_CLOSE_END + 20
      ? Math.sin(
          segmentProgress(frame, SHACKLE_CLOSE_END - 1, SHACKLE_CLOSE_END + 20) *
            Math.PI,
        ) * 0.12
      : 0;

  // Inner cryptographic ring accelerates during key exchange, then glides smoothly
  const innerRingSpin =
    frame * 0.025 + keyExchangeProgress * Math.PI * 1.4;

  // Encrypted HTTPS tunnel expands along the Data Cable once TLS locks
  const tlsTunnelProgress = easeOutCubic(
    segmentProgress(frame, TUNNEL_EXPAND_START, TUNNEL_EXPAND_END),
  );

  // Packet gains its TLS encrypted shield halo before passing through the Gate at frame 960
  const packetTlsEncrypted =
    frame < PACKET_ENCRYPT_START
      ? 0
      : easeOutCubic(
          segmentProgress(frame, PACKET_ENCRYPT_START, PACKET_ENCRYPT_END),
        );

  // Concentric lock-snap shockwaves radiating from the padlock & security gate
  const shockwaves: Station3Shockwave[] = SHOCKWAVE_START_FRAMES.map(
    (startFrame, index) => {
      const rawProgress = (frame - startFrame) / SHOCKWAVE_DURATION_FRAMES;
      if (rawProgress <= 0 || rawProgress >= 1) {
        return {
          index,
          progress: clamp(rawProgress, 0, 1),
          radius: 0.2,
          opacity: 0,
          active: false,
        };
      }

      const eased = easeOutCubic(rawProgress);
      const radius = 0.22 + eased * (0.95 + index * 0.22);
      const fadeIn = smoothstep(clamp(rawProgress / 0.14, 0, 1));
      const fadeOut = 1 - smoothstep(clamp((rawProgress - 0.3) / 0.7, 0, 1));
      const opacity = clamp(fadeIn * fadeOut * (0.9 - index * 0.14), 0, 1);

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
    isStation3Active,
    gateFloatY,
    innerRingSpin,
    tcpSteps,
    tcpEstablished,
    activePulse,
    gateImpactGlow,
    tlsStatus,
    keyExchangeProgress,
    shackleCloseProgress,
    padlockSnapBounce,
    isTlsLocked,
    tlsTunnelProgress,
    packetTlsEncrypted,
    shockwaves,
  };
}
