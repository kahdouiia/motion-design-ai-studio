import {describe, expect, it} from 'vitest';
import {STATION6_TIMELINE, getStation6State} from './station6';

describe('Station 6 Browser Rendering & Finale Choreography', () => {
  it('is deterministic and keeps all scalars bounded across frames 0..2250', () => {
    for (let frame = 0; frame <= STATION6_TIMELINE.stationEnd; frame += 7) {
      const state = getStation6State(frame);
      expect(state).toEqual(getStation6State(frame));
      expect(state.arrivalGlow).toBeGreaterThanOrEqual(0);
      expect(state.arrivalGlow).toBeLessThanOrEqual(1);
      expect(state.linkUiScale).toBeGreaterThanOrEqual(0);
      expect(state.linkUiScale).toBeLessThanOrEqual(1);
      expect(state.domProgress).toBeGreaterThanOrEqual(0);
      expect(state.domProgress).toBeLessThanOrEqual(1);
      expect(state.cssProgress).toBeGreaterThanOrEqual(0);
      expect(state.cssProgress).toBeLessThanOrEqual(1);
      expect(state.jsProgress).toBeGreaterThanOrEqual(0);
      expect(state.jsProgress).toBeLessThanOrEqual(1);
      expect(state.googlePageOpacity).toBeGreaterThanOrEqual(0);
      expect(state.googlePageOpacity).toBeLessThanOrEqual(1);
      expect(state.overviewProgress).toBeGreaterThanOrEqual(0);
      expect(state.overviewProgress).toBeLessThanOrEqual(1);
    }
  });

  it('keeps Station 1 Smartphone widgets intact prior to Packet arrival and dismisses them on arrival', () => {
    const beforeStation6 = getStation6State(120);
    expect(beforeStation6.phase).toBe('idle');
    expect(beforeStation6.linkUiScale).toBe(1);
    expect(beforeStation6.googlePageOpacity).toBe(0);

    const returning = getStation6State(1960);
    expect(returning.phase).toBe('returning');
    expect(returning.packetArrived).toBe(false);
    expect(returning.linkUiScale).toBe(1);

    const parsing = getStation6State(2056);
    expect(parsing.phase).toBe('parsing');
    expect(parsing.packetArrived).toBe(true);
    expect(parsing.linkUiScale).toBe(0);
    expect(parsing.arrivalGlow).toBeGreaterThan(0.2);
  });

  it('runs the DOM -> CSS -> JS rendering stages sequentially after Packet arrival', () => {
    const domActive = getStation6State(2052);
    expect(domActive.stages[0].status).toBe('active');
    expect(domActive.stages[1].status).toBe('pending');
    expect(domActive.stages[2].status).toBe('pending');

    const cssActive = getStation6State(2070);
    expect(cssActive.stages[0].status).toBe('done');
    expect(cssActive.stages[1].status).toBe('active');

    const jsActive = getStation6State(2088);
    expect(jsActive.stages[0].status).toBe('done');
    expect(jsActive.stages[1].status).toBe('done');
    expect(jsActive.stages[2].status).toBe('active');
  });

  it('renders the complete Google Search page cleanly by hero frame 2100', () => {
    const hero = getStation6State(2100);
    expect(hero.phase).toBe('rendered');
    expect(hero.renderComplete).toBe(true);
    expect(hero.googlePageOpacity).toBe(1);
    expect(hero.domProgress).toBe(1);
    expect(hero.cssProgress).toBe(1);
    expect(hero.jsProgress).toBe(1);
    expect(hero.stages.every((stage) => stage.status === 'done')).toBe(true);
  });

  it('transitions into the full Continuous World pull-back overview across frames 2110..2250', () => {
    const startOverview = getStation6State(2110);
    expect(startOverview.phase).toBe('overview');
    expect(startOverview.overviewProgress).toBe(0);

    const midOverview = getStation6State(2180);
    expect(midOverview.overviewProgress).toBeGreaterThan(0.4);
    expect(midOverview.overviewProgress).toBeLessThan(0.6);

    const endOverview = getStation6State(2250);
    expect(endOverview.phase).toBe('overview');
    expect(endOverview.overviewProgress).toBe(1);
    expect(endOverview.renderComplete).toBe(true);
  });
});
