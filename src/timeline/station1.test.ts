import * as THREE from 'three';
import {describe, expect, it} from 'vitest';
import {DATA_CABLE_CONTROL_POINTS, getChoreographyState} from './choreography';
import {
  SMARTPHONE_BASE_POSITION,
  SMARTPHONE_ROTATION,
  SMARTPHONE_TAP_LOCAL_OFFSET,
  STATION1_END_FRAME,
  TARGET_DOMAIN,
  applyEulerXYZ,
  computeSmartphoneTapWorldPosition,
  getStation1State,
} from './station1';

describe('Station 1 Deterministic Choreography (frames 0..240)', () => {
  it('aligns the smartphone tap target with DATA_CABLE_CONTROL_POINTS[0] and matches Three.js Euler XYZ', () => {
    const pureRotated = applyEulerXYZ(
      SMARTPHONE_TAP_LOCAL_OFFSET,
      SMARTPHONE_ROTATION,
    );
    const threeRotated = new THREE.Vector3(
      SMARTPHONE_TAP_LOCAL_OFFSET[0],
      SMARTPHONE_TAP_LOCAL_OFFSET[1],
      SMARTPHONE_TAP_LOCAL_OFFSET[2],
    ).applyEuler(
      new THREE.Euler(
        SMARTPHONE_ROTATION[0],
        SMARTPHONE_ROTATION[1],
        SMARTPHONE_ROTATION[2],
        'XYZ',
      ),
    );

    expect(pureRotated[0]).toBeCloseTo(threeRotated.x, 5);
    expect(pureRotated[1]).toBeCloseTo(threeRotated.y, 5);
    expect(pureRotated[2]).toBeCloseTo(threeRotated.z, 5);

    const worldTap = computeSmartphoneTapWorldPosition(
      SMARTPHONE_BASE_POSITION,
      SMARTPHONE_ROTATION,
    );
    const cableStart = DATA_CABLE_CONTROL_POINTS[0];

    expect(worldTap[0]).toBeCloseTo(cableStart[0], 4);
    expect(worldTap[1]).toBeCloseTo(cableStart[1], 4);
    expect(worldTap[2]).toBeCloseTo(cableStart[2], 4);
  });

  it('is strictly deterministic and finite across frames 0..240 and invalid inputs', () => {
    for (let frame = 0; frame <= STATION1_END_FRAME; frame++) {
      const state = getStation1State(frame);
      expect(state).toEqual(getStation1State(frame));
      expect(Number.isFinite(state.phoneEntranceProgress)).toBe(true);
      expect(Number.isFinite(state.phoneFloatY)).toBe(true);
      expect(Number.isFinite(state.fingerApproach)).toBe(true);
      expect(Number.isFinite(state.fingerPressDepth)).toBe(true);
      expect(Number.isFinite(state.packetLaunchCharge)).toBe(true);
      for (const ripple of state.ripples) {
        expect(Number.isFinite(ripple.radius)).toBe(true);
        expect(Number.isFinite(ripple.opacity)).toBe(true);
        expect(ripple.opacity).toBeGreaterThanOrEqual(0);
        expect(ripple.opacity).toBeLessThanOrEqual(1);
      }
    }

    for (const invalid of [-50, Number.NaN, Number.NEGATIVE_INFINITY]) {
      const state = getStation1State(invalid);
      expect(state.frame).toBe(0);
      expect(state.typedText).toBe('');
      expect(state.browserCacheStatus).toBe('idle');
    }
  });

  it('types google.com monotonically before the finger tap', () => {
    expect(getStation1State(0).typedText).toBe('');

    let previousLength = 0;
    for (let frame = 0; frame <= 80; frame++) {
      const state = getStation1State(frame);
      expect(state.typedText).toBe(TARGET_DOMAIN.slice(0, state.typedCharCount));
      expect(state.typedCharCount).toBeGreaterThanOrEqual(previousLength);
      previousLength = state.typedCharCount;
    }

    const midTyping = getStation1State(35);
    expect(midTyping.typedCharCount).toBeGreaterThan(2);
    expect(midTyping.typedCharCount).toBeLessThan(TARGET_DOMAIN.length);

    const completed = getStation1State(65);
    expect(completed.typedText).toBe('google.com');
    expect(completed.isTypingComplete).toBe(true);
  });

  it('animates the 3D finger approach, tap contact, concentric ripples, and retraction', () => {
    expect(getStation1State(20).fingerVisible).toBe(false);
    expect(getStation1State(20).ripples.every((r) => !r.active)).toBe(true);

    // At hero frame 120: google.com typed, finger touching tap pill, multiple ripple rings active
    const frame120 = getStation1State(120);
    expect(frame120.typedText).toBe('google.com');
    expect(frame120.fingerVisible).toBe(true);
    expect(frame120.fingerApproach).toBe(1);
    expect(frame120.fingerPressDepth).toBeGreaterThan(0.7);
    expect(frame120.ripples.filter((r) => r.active).length).toBeGreaterThanOrEqual(2);

    // Verify ripple 0 expands monotonically while active
    let prevRadius = 0;
    for (let frame = 97; frame <= 150; frame++) {
      const r0 = getStation1State(frame).ripples[0];
      expect(r0.radius).toBeGreaterThanOrEqual(prevRadius);
      prevRadius = r0.radius;
    }

    // Finger retracts cleanly before the Packet launches down the Data Cable
    const retracted = getStation1State(180);
    expect(retracted.fingerVisible).toBe(false);
    expect(retracted.fingerApproach).toBe(0);
  });

  it('runs Browser & OS local Cache checks to MISS before Packet launches into the Data Cable', () => {
    expect(getStation1State(10).browserCacheStatus).toBe('idle');
    expect(getStation1State(10).osCacheStatus).toBe('idle');

    expect(getStation1State(105).browserCacheStatus).toBe('checking');
    expect(getStation1State(105).osCacheStatus).toBe('idle');

    expect(getStation1State(120).browserCacheStatus).toBe('miss');
    expect(getStation1State(120).osCacheStatus).toBe('checking');

    expect(getStation1State(150).browserCacheStatus).toBe('miss');
    expect(getStation1State(150).osCacheStatus).toBe('miss');
    expect(getStation1State(150).cacheMissSummaryVisible).toBe(true);

    // Launch charge peaks right at frame 180 when choreography Packet starts descending
    const launchPeak = getStation1State(180);
    expect(launchPeak.packetLaunchCharge).toBeCloseTo(1, 3);
    expect(getChoreographyState(180).packetProgress).toBe(0);
    expect(getChoreographyState(210).packetProgress).toBeGreaterThan(0.05);
    expect(getChoreographyState(240).packetProgress).toBeCloseTo(0.2, 3);
  });
});
