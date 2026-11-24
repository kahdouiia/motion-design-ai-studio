import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {FPS, STATIONS, TOTAL_FRAMES} from './choreography';
import {
  computeStationAudioPlacement,
  getActiveNarration,
  normalizePersianTtsText,
  parseScript75s,
} from './narration';
import {NARRATION_TRACKS} from './narrationManifest';

const ROOT_DIR = path.resolve(process.cwd());

describe('Persian Narration Script & Audio Sync', () => {
  it('parses all 6 stations from docs/script-75s.md matching STATIONS frame boundaries', () => {
    const markdown = readFileSync(path.join(ROOT_DIR, 'docs/script-75s.md'), 'utf8');
    const parsed = parseScript75s(markdown);

    expect(parsed).toHaveLength(6);
    for (let i = 0; i < STATIONS.length; i++) {
      expect(parsed[i].stationIndex).toBe(STATIONS[i].index);
      expect(parsed[i].stationId).toBe(STATIONS[i].id);
      expect(parsed[i].stationStartFrame).toBe(STATIONS[i].startFrame);
      expect(parsed[i].stationEndFrame).toBe(STATIONS[i].endFrame);
      expect(parsed[i].rawText.length).toBeGreaterThan(20);
      expect(parsed[i].spokenText.length).toBeGreaterThan(20);
    }
  });

  it('normalizes markdown tokens and technical terms for smooth Persian TTS pronunciation', () => {
    const normalized = normalizePersianTtsText(
      '«وقتی می‌زنی `google.com` درخواست می‌ره سراغ DNS Resolver و با `200 OK` و HTML و CSS و DOM برمی‌گرده.»',
    );

    expect(normalized).not.toContain('`');
    expect(normalized).not.toContain('«');
    expect(normalized).not.toContain('»');
    expect(normalized).toContain('گوگل دات کام');
    expect(normalized).toContain('دی‌ان‌اس ریزالور');
    expect(normalized).toContain('دویست اوکی');
    expect(normalized).toContain('اچ‌تی‌ام‌اِل');
    expect(normalized).toContain('سی‌اِس‌اِس');
    expect(normalized).toContain('دام');
  });

  it('places station audio strictly inside station windows with lead-in when slack allows', () => {
    const comfortable = computeStationAudioPlacement(240, 660, 10.0, FPS);
    expect(comfortable.audioStartFrame).toBe(248);
    expect(comfortable.durationFrames).toBe(300);
    expect(comfortable.audioEndFrame).toBe(548);
    expect(comfortable.exceedsWindow).toBe(false);
    expect(comfortable.remainingFrames).toBe(112);

    const tight = computeStationAudioPlacement(0, 240, 7.9, FPS);
    expect(tight.audioStartFrame).toBeGreaterThanOrEqual(0);
    expect(tight.audioEndFrame).toBeLessThanOrEqual(240);
    expect(tight.exceedsWindow).toBe(false);

    const overflow = computeStationAudioPlacement(0, 240, 12.0, FPS);
    expect(overflow.audioStartFrame).toBe(0);
    expect(overflow.audioEndFrame).toBe(240);
    expect(overflow.exceedsWindow).toBe(true);
  });

  it('has 6 generated, non-overlapping, unclipped narration tracks across 0..2250 existing on disk', () => {
    expect(NARRATION_TRACKS).toHaveLength(6);

    for (let i = 0; i < NARRATION_TRACKS.length; i++) {
      const track = NARRATION_TRACKS[i];
      const station = STATIONS[i];

      expect(track.stationIndex).toBe(station.index);
      expect(track.stationId).toBe(station.id);
      expect(track.durationSeconds).toBeGreaterThan(2);
      expect(track.audioStartFrame).toBeGreaterThanOrEqual(station.startFrame);
      expect(track.audioEndFrame).toBeLessThanOrEqual(TOTAL_FRAMES);
      // Every syllable must play completely (no truncation of durationSeconds)
      expect(track.durationFrames).toBeGreaterThanOrEqual(Math.ceil(track.durationSeconds * FPS));
      expect(track.audioEndFrame - track.audioStartFrame).toBe(track.durationFrames);

      // Stations 2..6 must finish strictly inside their own station window
      if (station.index >= 2) {
        expect(track.audioEndFrame).toBeLessThanOrEqual(station.endFrame);
      }

      // Zero overlap between consecutive stations (with clean breathing gap)
      if (i > 0) {
        expect(track.audioStartFrame).toBeGreaterThanOrEqual(
          NARRATION_TRACKS[i - 1].audioEndFrame + 6,
        );
      }

      const fullAudioPath = path.join(ROOT_DIR, 'public', track.audioFile);
      expect(existsSync(fullAudioPath), `missing audio file ${fullAudioPath}`).toBe(true);
      expect(statSync(fullAudioPath).size).toBeGreaterThan(10_000);
    }
  });

  it('resolves the active narration segment deterministically across frames', () => {
    const first = NARRATION_TRACKS[0];
    expect(getActiveNarration(first.audioStartFrame, NARRATION_TRACKS)?.stationIndex).toBe(1);
    expect(getActiveNarration(first.audioEndFrame - 1, NARRATION_TRACKS)?.stationIndex).toBe(1);
    expect(getActiveNarration(Number.NaN, NARRATION_TRACKS)).toBeNull();
  });
});
