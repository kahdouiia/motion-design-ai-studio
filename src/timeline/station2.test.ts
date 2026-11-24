import {describe, expect, it} from 'vitest';
import {getChoreographyState} from './choreography';
import {
  DNS_CABLE_ANCHOR,
  DNS_PACKET_WAIT_POSITION,
  DNS_PLATFORM_POSITION,
  RESOLVED_IP,
  STATION2_END_FRAME,
  STATION2_START_FRAME,
  getStation2State,
} from './station2';

describe('Station 2 Deterministic DNS Choreography (frames 240..660)', () => {
  it('is strictly deterministic and finite across frames 240..660 and invalid inputs', () => {
    for (let frame = STATION2_START_FRAME; frame <= STATION2_END_FRAME; frame++) {
      const state = getStation2State(frame);
      expect(state).toEqual(getStation2State(frame));
      expect(Number.isFinite(state.platformFloatY)).toBe(true);
      expect(Number.isFinite(state.pinBounceY)).toBe(true);
      expect(Number.isFinite(state.pinGlowIntensity)).toBe(true);
      expect(Number.isFinite(state.resolverArcOpacity)).toBe(true);
      expect(state.resolverArcOpacity).toBeGreaterThanOrEqual(0);
      expect(state.resolverArcOpacity).toBeLessThanOrEqual(1);
      for (const ripple of state.ripples) {
        expect(Number.isFinite(ripple.radius)).toBe(true);
        expect(ripple.opacity).toBeGreaterThanOrEqual(0);
        expect(ripple.opacity).toBeLessThanOrEqual(1);
      }
    }

    for (const invalid of [-10, Number.NaN, Number.NEGATIVE_INFINITY]) {
      const state = getStation2State(invalid);
      expect(state.frame).toBe(0);
      expect(state.isResolved).toBe(false);
      expect(state.resolverArcOpacity).toBe(0);
    }
  });

  it('positions the DNS Platform near y = +5 aligned with the Data Cable anchor', () => {
    expect(DNS_PLATFORM_POSITION[1]).toBeCloseTo(4.7, 2);
    expect(DNS_CABLE_ANCHOR[1]).toBeCloseTo(5.0, 2);
    expect(DNS_PACKET_WAIT_POSITION[1]).toBeGreaterThan(5.2);
    expect(DNS_PACKET_WAIT_POSITION[1]).toBeLessThan(6.5);
    expect(RESOLVED_IP).toBe('142.250.185.78');
  });

  it('progresses the 3-hop recursive DNS lookup strictly in order (Root -> TLD -> Authoritative)', () => {
    const beforeQuery = getStation2State(300);
    expect(beforeQuery.hops.every((h) => h.status === 'idle')).toBe(true);
    expect(beforeQuery.isResolved).toBe(false);

    const rootPhase = getStation2State(364);
    expect(rootPhase.hops[0].status).toBe('querying');
    expect(rootPhase.hops[1].status).toBe('idle');
    expect(rootPhase.hops[2].status).toBe('idle');

    const tldPhase = getStation2State(392);
    expect(tldPhase.hops[0].status).toBe('resolved');
    expect(tldPhase.hops[1].status).toBe('querying');
    expect(tldPhase.hops[2].status).toBe('idle');

    const authPhase = getStation2State(420);
    expect(authPhase.hops[0].status).toBe('resolved');
    expect(authPhase.hops[1].status).toBe('resolved');
    expect(authPhase.hops[2].status).toBe('querying');
    expect(authPhase.isResolved).toBe(false);
  });

  it('shows resolved IP, active radar ripples, and return pulse at hero frame 450', () => {
    const hero = getStation2State(450);
    expect(hero.isStation2Active).toBe(true);
    expect(hero.isResolved).toBe(true);
    expect(hero.resolvedRevealProgress).toBeGreaterThan(0.75);
    expect(hero.hops.every((h) => h.status === 'resolved')).toBe(true);
    expect(hero.resolverArcOpacity).toBe(1);
    expect(hero.topPillGlow).toBeGreaterThan(0.8);
    expect(hero.bottomPillGlow).toBeGreaterThan(0.75);
    expect(hero.returnPulseProgress).toBeGreaterThan(0);
    expect(hero.returnPulseProgress).toBeLessThan(1);
    expect(hero.ripples.filter((r) => r.active).length).toBeGreaterThanOrEqual(1);
  });

  it('attaches the resolved IP collar to the Packet before it departs at frame 560 and fades arc cleanly outside Station 2', () => {
    expect(getStation2State(450).packetIpAttached).toBe(0);

    const beforeDepart = getStation2State(550);
    expect(beforeDepart.packetIpAttached).toBeCloseTo(1, 3);
    expect(getChoreographyState(550).packetProgress).toBeCloseTo(0.28, 3);

    // Packet departs smoothly after frame 560
    expect(getChoreographyState(620).packetProgress).toBeGreaterThan(0.35);
    expect(getStation2State(620).packetIpAttached).toBeCloseTo(1, 3);

    // Resolver arc stays hidden during Station 1 and Station 6 overview
    expect(getStation2State(120).resolverArcOpacity).toBe(0);
    expect(getStation2State(620).resolverArcOpacity).toBe(0);
    expect(getStation2State(2200).resolverArcOpacity).toBe(0);
  });
});
