import {describe, expect, it} from 'vitest';
import {
  DATA_CABLE_CONTROL_POINTS,
  FPS,
  STATIONS,
  TOTAL_FRAMES,
  WORLD_BOUNDS,
  evaluateDataCablePoint,
  getChoreographyState,
  type Vec3,
} from './choreography';

function distance3(a: Vec3, b: Vec3): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.hypot(dx, dy, dz);
}

describe('Continuous World Choreography', () => {
  it('defines a 75-second, 30fps timeline with 6 stations covering 0..2250', () => {
    expect(FPS).toBe(30);
    expect(TOTAL_FRAMES).toBe(2250);
    expect(STATIONS).toHaveLength(6);
    expect(STATIONS[0].startFrame).toBe(0);
    expect(STATIONS[STATIONS.length - 1].endFrame).toBe(TOTAL_FRAMES);

    for (let i = 0; i < STATIONS.length; i++) {
      const station = STATIONS[i];
      expect(station.index).toBe(i + 1);
      expect(station.persianTitle.trim().length).toBeGreaterThan(0);
      expect(station.persianSubtitle.trim().length).toBeGreaterThan(0);
      expect(station.technicalBadges.length).toBeGreaterThan(0);
      if (i > 0) {
        expect(station.startFrame).toBe(STATIONS[i - 1].endFrame);
      }
    }
  });

  it('maps exact Station boundary frames (0, 240, 660, 1050, 1530, 1890, 2250)', () => {
    const boundaryExpectations: Array<[number, number, number]> = [
      [0, 1, 12],
      [239, 1, 12],
      [240, 2, 5],
      [659, 2, 5],
      [660, 3, 0],
      [1049, 3, 0],
      [1050, 4, -6],
      [1529, 4, -6],
      [1530, 5, -13],
      [1889, 5, -13],
      [1890, 6, 12],
      [2249, 6, 12],
      [2250, 6, 12],
    ];

    for (const [frame, expectedStation, expectedAnchorY] of boundaryExpectations) {
      const state = getChoreographyState(frame);
      expect(state.stationIndex, `frame ${frame} stationIndex`).toBe(expectedStation);
      expect(state.station.anchorY, `frame ${frame} anchorY`).toBe(expectedAnchorY);
    }
  });

  it('clamps out-of-bounds and non-finite frame inputs without NaN', () => {
    const invalidFrames = [-1000, -1, 2251, 99999, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY];

    for (const input of invalidFrames) {
      const state = getChoreographyState(input);
      expect(Number.isFinite(state.frame)).toBe(true);
      expect(state.frame).toBeGreaterThanOrEqual(0);
      expect(state.frame).toBeLessThanOrEqual(TOTAL_FRAMES);
      expect(state.stationIndex).toBeGreaterThanOrEqual(1);
      expect(state.stationIndex).toBeLessThanOrEqual(6);
      expect(state.packetProgress).toBeGreaterThanOrEqual(0);
      expect(state.packetProgress).toBeLessThanOrEqual(1);
      expect(state.stationProgress).toBeGreaterThanOrEqual(0);
      expect(state.stationProgress).toBeLessThanOrEqual(1);

      for (const component of [...state.cameraPosition, ...state.cameraLookAt, ...state.packetPosition]) {
        expect(Number.isFinite(component)).toBe(true);
      }
    }

    expect(getChoreographyState(-50)).toEqual(getChoreographyState(0));
    expect(getChoreographyState(5000)).toEqual(getChoreographyState(TOTAL_FRAMES));
  });

  it('is deterministic, within WORLD_BOUNDS, and continuous across every frame 0..2250', () => {
    let previous = getChoreographyState(0);

    for (let frame = 0; frame <= TOTAL_FRAMES; frame++) {
      const state = getChoreographyState(frame);
      expect(state).toEqual(getChoreographyState(frame));

      expect(state.packetProgress).toBeGreaterThanOrEqual(0);
      expect(state.packetProgress).toBeLessThanOrEqual(1);
      expect(state.stationProgress).toBeGreaterThanOrEqual(0);
      expect(state.stationProgress).toBeLessThanOrEqual(1);
      expect(state.cameraFov).toBeGreaterThanOrEqual(WORLD_BOUNDS.minFov);
      expect(state.cameraFov).toBeLessThanOrEqual(WORLD_BOUNDS.maxFov);

      const [cx, cy, cz] = state.cameraPosition;
      const [lx, ly, lz] = state.cameraLookAt;
      expect(cx).toBeGreaterThanOrEqual(WORLD_BOUNDS.minX);
      expect(cx).toBeLessThanOrEqual(WORLD_BOUNDS.maxX);
      expect(cy).toBeGreaterThanOrEqual(WORLD_BOUNDS.minY);
      expect(cy).toBeLessThanOrEqual(WORLD_BOUNDS.maxY);
      expect(cz).toBeGreaterThanOrEqual(WORLD_BOUNDS.minZ);
      expect(cz).toBeLessThanOrEqual(WORLD_BOUNDS.maxZ);

      expect(lx).toBeGreaterThanOrEqual(WORLD_BOUNDS.minX);
      expect(lx).toBeLessThanOrEqual(WORLD_BOUNDS.maxX);
      expect(ly).toBeGreaterThanOrEqual(WORLD_BOUNDS.minY);
      expect(ly).toBeLessThanOrEqual(WORLD_BOUNDS.maxY);
      expect(lz).toBeGreaterThanOrEqual(WORLD_BOUNDS.minZ);
      expect(lz).toBeLessThanOrEqual(WORLD_BOUNDS.maxZ);

      if (frame > 0) {
        expect(distance3(state.cameraPosition, previous.cameraPosition)).toBeLessThan(1.0);
        expect(distance3(state.cameraLookAt, previous.cameraLookAt)).toBeLessThan(1.0);
      }

      previous = state;
    }
  });

  it('descends through Stations 1 to 5, returns to Smartphone, and pulls back for the full overview', () => {
    const s1 = getChoreographyState(100);
    const s2 = getChoreographyState(450);
    const s3 = getChoreographyState(850);
    const s4 = getChoreographyState(1300);
    const s5 = getChoreographyState(1700);
    const s6Phone = getChoreographyState(2060);
    const s6Overview = getChoreographyState(2250);

    expect(s1.cameraLookAt[1]).toBeGreaterThan(s2.cameraLookAt[1]);
    expect(s2.cameraLookAt[1]).toBeGreaterThan(s3.cameraLookAt[1]);
    expect(s3.cameraLookAt[1]).toBeGreaterThan(s4.cameraLookAt[1]);
    expect(s4.cameraLookAt[1]).toBeGreaterThan(s5.cameraLookAt[1]);

    // Returns back up to Smartphone around y = +12 in Station 6
    expect(s6Phone.cameraLookAt[1]).toBeGreaterThan(10);

    // Pulls back at the finale to show the full vertical Continuous World inside the Shorts safe-zone window
    expect(s6Overview.cameraPosition[2]).toBeGreaterThan(45);
    expect(s6Overview.cameraLookAt[1]).toBeGreaterThan(-8);
    expect(s6Overview.cameraLookAt[1]).toBeLessThan(1);
  });

  it('drives the Packet outbound to the Server Rack and inbound back to the Smartphone along the Data Cable', () => {
    expect(DATA_CABLE_CONTROL_POINTS.length).toBeGreaterThanOrEqual(5);

    const top = evaluateDataCablePoint(0);
    const bottom = evaluateDataCablePoint(1);
    expect(top[1]).toBeCloseTo(12, 3);
    expect(bottom[1]).toBeCloseTo(-13, 3);

    // Y decreases monotonically along the Data Cable from progress 0 -> 1
    let prevY = top[1];
    for (let i = 1; i <= 50; i++) {
      const point = evaluateDataCablePoint(i / 50);
      expect(point[1]).toBeLessThanOrEqual(prevY + 1e-6);
      prevY = point[1];
    }

    // Outbound leg starts at 0 and reaches 1 at Station 5
    const start = getChoreographyState(0);
    expect(start.packetProgress).toBe(0);
    expect(start.packetDirection).toBe('outbound');

    const atServer = getChoreographyState(1700);
    expect(atServer.packetProgress).toBeCloseTo(1, 3);

    // Inbound leg returns to Smartphone at progress 0 during Station 6
    const returning = getChoreographyState(1940);
    expect(returning.packetDirection).toBe('inbound');
    expect(returning.packetProgress).toBeGreaterThan(0);
    expect(returning.packetProgress).toBeLessThan(1);

    const finished = getChoreographyState(2200);
    expect(finished.packetDirection).toBe('inbound');
    expect(finished.packetProgress).toBe(0);
  });
});
