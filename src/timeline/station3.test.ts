import {describe, expect, it} from 'vitest';
import {getChoreographyState} from './choreography';
import {
  SECURITY_GATE_POSITION,
  STATION3_END_FRAME,
  STATION3_START_FRAME,
  TCP_GATE_CABLE_PROGRESS,
  TCP_PACKET_CABLE_PROGRESS,
  getStation3State,
} from './station3';

describe('Station 3 Deterministic TCP + TLS Choreography (frames 660..1050)', () => {
  it('is strictly deterministic and finite across frames 660..1050 and invalid inputs', () => {
    for (let frame = STATION3_START_FRAME; frame <= STATION3_END_FRAME; frame++) {
      const state = getStation3State(frame);
      expect(state).toEqual(getStation3State(frame));
      expect(Number.isFinite(state.gateFloatY)).toBe(true);
      expect(Number.isFinite(state.shackleCloseProgress)).toBe(true);
      expect(state.shackleCloseProgress).toBeGreaterThanOrEqual(0);
      expect(state.shackleCloseProgress).toBeLessThanOrEqual(1);
      expect(state.tlsTunnelProgress).toBeGreaterThanOrEqual(0);
      expect(state.tlsTunnelProgress).toBeLessThanOrEqual(1);
      for (const wave of state.shockwaves) {
        expect(Number.isFinite(wave.radius)).toBe(true);
        expect(wave.opacity).toBeGreaterThanOrEqual(0);
        expect(wave.opacity).toBeLessThanOrEqual(1);
      }
    }

    for (const invalid of [-100, Number.NaN, Number.NEGATIVE_INFINITY]) {
      const state = getStation3State(invalid);
      expect(state.frame).toBe(0);
      expect(state.tcpEstablished).toBe(false);
      expect(state.isTlsLocked).toBe(false);
    }
  });

  it('positions the Security Gate at y = 0 on the Data Cable below the waiting Packet', () => {
    expect(SECURITY_GATE_POSITION[1]).toBeCloseTo(0, 3);
    expect(TCP_GATE_CABLE_PROGRESS).toBeGreaterThan(TCP_PACKET_CABLE_PROGRESS);
  });

  it('animates SYN (down), SYN-ACK (up), and ACK (down) in exact TCP 3-way handshake order', () => {
    // Before handshake
    const idle = getStation3State(700);
    expect(idle.tcpSteps.every((s) => s.status === 'idle')).toBe(true);
    expect(idle.activePulse.active).toBe(false);
    expect(idle.shackleCloseProgress).toBe(0);

    // SYN travels down
    const synEarly = getStation3State(732);
    const synLate = getStation3State(750);
    expect(synEarly.activePulse.stepId).toBe('syn');
    expect(synEarly.activePulse.direction).toBe('down');
    expect(synLate.activePulse.cableProgress).toBeGreaterThan(
      synEarly.activePulse.cableProgress,
    );

    // SYN-ACK travels up
    const synAckEarly = getStation3State(766);
    const synAckLate = getStation3State(784);
    expect(synAckEarly.tcpSteps[0].status).toBe('done');
    expect(synAckEarly.activePulse.stepId).toBe('syn-ack');
    expect(synAckEarly.activePulse.direction).toBe('up');
    expect(synAckLate.activePulse.cableProgress).toBeLessThan(
      synAckEarly.activePulse.cableProgress,
    );

    // ACK travels down
    const ackMid = getStation3State(808);
    expect(ackMid.tcpSteps[0].status).toBe('done');
    expect(ackMid.tcpSteps[1].status).toBe('done');
    expect(ackMid.activePulse.stepId).toBe('ack');
    expect(ackMid.activePulse.direction).toBe('down');
    expect(ackMid.tcpEstablished).toBe(false);
  });

  it('snaps the TLS padlock closed with shockwaves and HTTPS tunnel at hero frame 850', () => {
    const midClose = getStation3State(836);
    expect(midClose.tcpEstablished).toBe(true);
    expect(midClose.tlsStatus).toBe('handshaking');
    expect(midClose.shackleCloseProgress).toBeGreaterThan(0.2);
    expect(midClose.shackleCloseProgress).toBeLessThan(0.8);

    const hero = getStation3State(850);
    expect(hero.isStation3Active).toBe(true);
    expect(hero.tcpEstablished).toBe(true);
    expect(hero.tcpSteps.every((s) => s.status === 'done')).toBe(true);
    expect(hero.isTlsLocked).toBe(true);
    expect(hero.tlsStatus).toBe('locked');
    expect(hero.shackleCloseProgress).toBe(1);
    expect(hero.tlsTunnelProgress).toBeGreaterThan(0.15);
    expect(hero.shockwaves.filter((w) => w.active).length).toBeGreaterThanOrEqual(1);
  });

  it('encrypts the Packet before it resumes through the Security Gate at frame 960', () => {
    const beforeResume = getStation3State(950);
    expect(beforeResume.isTlsLocked).toBe(true);
    expect(beforeResume.tlsTunnelProgress).toBe(1);
    expect(beforeResume.packetTlsEncrypted).toBe(1);
    expect(getChoreographyState(950).packetProgress).toBeCloseTo(0.48, 3);

    // Packet passes cleanly through y = 0 toward Station 4 after frame 960
    expect(getChoreographyState(1020).packetProgress).toBeGreaterThan(0.56);
    expect(getStation3State(1020).isTlsLocked).toBe(true);
  });
});
