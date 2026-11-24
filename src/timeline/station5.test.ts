import {describe, expect, it} from 'vitest';
import {TOTAL_FRAMES, getChoreographyState} from './choreography';
import {
  SERVER_TIERS,
  STATION5_END_FRAME,
  STATION5_START_FRAME,
  getStation5State,
} from './station5';

describe('Station 5 — 3-Tier Server Rack & 200 OK Response', () => {
  it('is purely deterministic with finite, bounded outputs across all 0..2250 frames', () => {
    for (let f = 0; f <= TOTAL_FRAMES; f += 15) {
      const a = getStation5State(f);
      const b = getStation5State(f);
      expect(a).toEqual(b);

      expect(a.tiers).toHaveLength(3);
      expect(a.packetDockScale).toBeGreaterThanOrEqual(0);
      expect(a.packetDockScale).toBeLessThanOrEqual(1);
      expect(a.processingCharge).toBeGreaterThanOrEqual(0);
      expect(a.processingCharge).toBeLessThanOrEqual(1);
      expect(a.responsePayloadScale).toBeGreaterThanOrEqual(0);
      expect(a.responsePayloadScale).toBeLessThanOrEqual(1);

      for (const tier of a.tiers) {
        expect(tier.ledIntensity).toBeGreaterThanOrEqual(0);
        expect(tier.ledIntensity).toBeLessThanOrEqual(1);
        expect(tier.ventGlow).toBeGreaterThanOrEqual(0);
        expect(tier.ventGlow).toBeLessThanOrEqual(1);
      }
    }
  });

  it('absorbs the incoming Packet into the Server Rack before processing and re-launches it cleanly', () => {
    const incoming = getStation5State(1590);
    expect(incoming.phase).toBe('incoming');
    expect(incoming.packetDockScale).toBe(1);
    expect(incoming.isResponseLaunched).toBe(false);

    const docked = getStation5State(1710);
    expect(docked.packetDockScale).toBe(0);
    expect(docked.processingCharge).toBeGreaterThan(0.8);

    const launched = getStation5State(1800);
    expect(launched.phase).toBe('launched');
    expect(launched.packetDockScale).toBe(1);
    expect(launched.isResponseLaunched).toBe(true);
    expect(launched.responsePayloadScale).toBe(1);
    expect(getChoreographyState(1800).packetDirection).toBe('inbound');
  });

  it('runs the 3 server tiers in strict top-to-bottom LED cascade order', () => {
    expect(SERVER_TIERS.map((t) => t.id)).toEqual([
      'load-balancer',
      'app-server',
      'response-builder',
    ]);
    // Physically stacked top-to-bottom along Y
    expect(SERVER_TIERS[0].tierY).toBeGreaterThan(SERVER_TIERS[1].tierY);
    expect(SERVER_TIERS[1].tierY).toBeGreaterThan(SERVER_TIERS[2].tierY);

    const firstActive = SERVER_TIERS.map((_, idx) => {
      for (let f = STATION5_START_FRAME; f <= STATION5_END_FRAME; f++) {
        if (getStation5State(f).tiers[idx].status === 'active') return f;
      }
      return -1;
    });

    expect(firstActive[0]).toBeGreaterThan(1630);
    expect(firstActive[0]).toBeLessThan(firstActive[1]);
    expect(firstActive[1]).toBeLessThan(firstActive[2]);
    expect(firstActive[2]).toBeLessThan(1766);
  });

  it('frames hero moment (frame 1710) mid-processing with Tier 1 done and Tier 2 actively surging', () => {
    const hero = getStation5State(1710);
    expect(hero.isStation5Active).toBe(true);
    expect(hero.phase).toBe('processing');
    expect(hero.tiers[0].status).toBe('done');
    expect(hero.tiers[1].status).toBe('active');
    expect(hero.tiers[1].ledIntensity).toBeGreaterThan(0.5);
    expect(hero.tiers[2].status).toBe('idle');
    expect(hero.payloadAssetsReady[0].ready).toBe(true);
    expect(hero.isResponseLaunched).toBe(false);
  });

  it('fires emerald 200 OK launch shockwaves and readies all HTML/CSS/JS payload assets on launch', () => {
    const launchMoment = getStation5State(1782);
    expect(launchMoment.phase).toBe('launched');
    expect(launchMoment.isResponseLaunched).toBe(true);
    expect(launchMoment.tiers.every((t) => t.status === 'done' && t.isEmerald)).toBe(
      true,
    );
    expect(launchMoment.payloadAssetsReady.every((a) => a.ready)).toBe(true);
    expect(launchMoment.launchShockwaves.some((w) => w.active)).toBe(true);
  });
});
