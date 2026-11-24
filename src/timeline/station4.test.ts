import {describe, expect, it} from 'vitest';
import {TOTAL_FRAMES} from './choreography';
import {
  ISP_ROUTERS,
  NETWORK_LAYERS,
  STATION4_END_FRAME,
  STATION4_START_FRAME,
  getStation4State,
} from './station4';

describe('Station 4 — 4-Layer Network Stack, Encapsulation & ISP Routers', () => {
  it('is purely deterministic and produces finite, bounded outputs across all 0..2250 frames', () => {
    for (let f = 0; f <= TOTAL_FRAMES; f += 15) {
      const a = getStation4State(f);
      const b = getStation4State(f);
      expect(a).toEqual(b);

      expect(a.layers).toHaveLength(4);
      expect(a.routers).toHaveLength(2);
      expect(a.encapsulatedCount).toBeGreaterThanOrEqual(0);
      expect(a.encapsulatedCount).toBeLessThanOrEqual(4);
      expect(a.routersPassedCount).toBeGreaterThanOrEqual(0);
      expect(a.routersPassedCount).toBeLessThanOrEqual(2);

      for (const layer of a.layers) {
        expect(Number.isFinite(layer.ringAcquired)).toBe(true);
        expect(layer.ringAcquired).toBeGreaterThanOrEqual(0);
        expect(layer.ringAcquired).toBeLessThanOrEqual(1);
        expect(layer.platePulse).toBeGreaterThanOrEqual(0);
        expect(layer.platePulse).toBeLessThanOrEqual(1);
      }
      for (const router of a.routers) {
        expect(router.activity).toBeGreaterThanOrEqual(0);
        expect(router.activity).toBeLessThanOrEqual(1);
        expect(router.relayPulse).toBeGreaterThanOrEqual(0);
        expect(router.relayPulse).toBeLessThanOrEqual(1);
      }
    }
  });

  it('activates the 4 network layers sequentially (APP -> TCP -> IP -> LINK) along the descending Data Cable', () => {
    expect(NETWORK_LAYERS.map((l) => l.id)).toEqual([
      'application',
      'transport',
      'network',
      'link',
    ]);
    // Plate heights strictly descend downward along Y
    for (let i = 1; i < NETWORK_LAYERS.length; i++) {
      expect(NETWORK_LAYERS[i].plateY).toBeLessThan(NETWORK_LAYERS[i - 1].plateY);
      expect(NETWORK_LAYERS[i].cableProgress).toBeGreaterThan(
        NETWORK_LAYERS[i - 1].cableProgress,
      );
    }

    const firstDoneFrame = NETWORK_LAYERS.map((_, layerIdx) => {
      for (let f = STATION4_START_FRAME; f <= STATION4_END_FRAME; f++) {
        if (getStation4State(f).layers[layerIdx].status === 'done') {
          return f;
        }
      }
      return -1;
    });

    for (const f of firstDoneFrame) {
      expect(f).toBeGreaterThan(STATION4_START_FRAME);
      expect(f).toBeLessThan(STATION4_END_FRAME);
    }
    expect(firstDoneFrame[0]).toBeLessThan(firstDoneFrame[1]);
    expect(firstDoneFrame[1]).toBeLessThan(firstDoneFrame[2]);
    expect(firstDoneFrame[2]).toBeLessThan(firstDoneFrame[3]);
  });

  it('frames hero moment (frame 1290) mid-stack with APP & TCP done and IP actively wrapping', () => {
    const hero = getStation4State(1290);
    expect(hero.isStation4Active).toBe(true);
    expect(hero.routingPhase).toBe('encapsulating');
    expect(hero.layers[0].status).toBe('done');
    expect(hero.layers[0].ringAcquired).toBe(1);
    expect(hero.layers[1].status).toBe('done');
    expect(hero.layers[1].ringAcquired).toBe(1);
    expect(hero.layers[2].status).toBe('active');
    expect(hero.layers[3].status).toBe('idle');
    expect(hero.showEncapsulationRings).toBe(true);
    expect(hero.encapsulatedCount).toBeGreaterThanOrEqual(2);
  });

  it('completes all 4 encapsulation rings and routes sequentially past both flanking ISP router nodes before frame 1530', () => {
    const firstActiveRouterFrame = ISP_ROUTERS.map((_, routerIdx) => {
      for (let f = STATION4_START_FRAME; f <= STATION4_END_FRAME; f++) {
        if (getStation4State(f).routers[routerIdx].status === 'active') {
          return f;
        }
      }
      return -1;
    });

    for (const f of firstActiveRouterFrame) {
      expect(f).toBeGreaterThan(1310);
      expect(f).toBeLessThan(STATION4_END_FRAME);
    }
    expect(firstActiveRouterFrame[0]).toBeLessThan(firstActiveRouterFrame[1]);

    const lateStation4 = getStation4State(1515);
    expect(lateStation4.encapsulatedCount).toBe(4);
    expect(lateStation4.showEncapsulationRings).toBe(true);
    expect(lateStation4.routingPhase).toBe('forwarded');
  });

  it('keeps outbound encapsulation rings intact entering Station 5 and clears them on inbound response', () => {
    const enteringServer = getStation4State(1600);
    expect(enteringServer.encapsulatedCount).toBe(4);
    expect(enteringServer.showEncapsulationRings).toBe(true);

    const inboundResponse = getStation4State(1820);
    expect(inboundResponse.showEncapsulationRings).toBe(false);
  });
});
