import {
  FPS,
  STATIONS,
  TOTAL_FRAMES,
  type StationDefinition,
  type StationIndex,
} from './choreography';

export type NarrationProvider = 'gemini-tts' | 'edge-neural-tts';

export interface ParsedScriptSegment {
  readonly stationIndex: StationIndex;
  readonly stationId: StationDefinition['id'];
  readonly title: string;
  readonly stationStartFrame: number;
  readonly stationEndFrame: number;
  readonly rawText: string;
  readonly spokenText: string;
}

export interface NarrationSegment extends ParsedScriptSegment {
  readonly audioFile: string;
  readonly audioStartFrame: number;
  readonly durationSeconds: number;
  readonly durationFrames: number;
  readonly audioEndFrame: number;
  readonly voice: string;
  readonly provider: NarrationProvider;
  readonly rate: string;
}

export interface AudioPlacement {
  readonly audioStartFrame: number;
  readonly durationFrames: number;
  readonly audioEndFrame: number;
  readonly exceedsWindow: boolean;
  readonly remainingFrames: number;
}

const PERSIAN_DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

function toAsciiDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (digit) => PERSIAN_DIGIT_MAP[digit] ?? digit);
}

/**
 * Normalizes Persian voiceover text for natural TTS pronunciation by removing
 * markdown punctuation and mapping English technical tokens to crisp Persian
 * phonetics so the narrator reads smoothly without jarring accent switches.
 */
export function normalizePersianTtsText(rawText: string): string {
  const cleaned = rawText
    .replace(/[`«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const replacements: ReadonlyArray<readonly [RegExp, string]> = [
    [/\bgoogle\.com\b/gi, 'گوگل دات کام'],
    [/\bDNS\s+Resolver\b/gi, 'دی‌ان‌اس ریزالور'],
    [/\bTCP\s+Handshake\b/gi, 'تی‌سی‌پی هَندشِیک'],
    [/\bTLS\s+Handshake\b/gi, 'تی‌اِل‌اس هَندشِیک'],
    [/\b200\s+OK\b/gi, 'دویست اوکی'],
    [/\bHTTPS\b/gi, 'اچ‌تی‌تی‌پی‌اِس'],
    [/\bHTTP\b/gi, 'اچ‌تی‌تی‌پی'],
    [/\bHTML\b/gi, 'اچ‌تی‌ام‌اِل'],
    [/\bCSS\b/gi, 'سی‌اِس‌اِس'],
    [/\bDNS\b/gi, 'دی‌ان‌اِس'],
    [/\bISP\b/gi, 'آی‌اِس‌پی'],
    [/\bTCP\b/gi, 'تی‌سی‌پی'],
    [/\bTLS\b/gi, 'تی‌اِل‌اِس'],
    [/\bDOM\b/gi, 'دام'],
    [/\bIP\b/gi, 'آی‌پی'],
    [/\bTransport\b/gi, 'ترَنسپورت'],
    [/\bNetwork\b/gi, 'نِتوُرک'],
    [/\bApplication\b/gi, 'اَپلیکیشن'],
    [/\bLink\b/gi, 'لینک'],
  ];

  let result = cleaned;
  for (const [pattern, phonetic] of replacements) {
    result = result.replace(pattern, phonetic);
  }

  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Parses `docs/script-75s.md` into structured station narration segments,
 * anchored to `STATIONS` in `choreography.ts`.
 */
export function parseScript75s(markdown: string): ParsedScriptSegment[] {
  const sections = markdown.split(/^##\s+/m).slice(1);
  const parsed: ParsedScriptSegment[] = [];

  for (const section of sections) {
    const lines = section.split(/\r?\n/);
    const heading = lines[0]?.trim() ?? '';
    const headingMatch = heading.match(/^ایستگاه\s+([۰-۹0-9]+)\s*[:：]\s*(.+?)\s*\(/);
    if (!headingMatch) {
      continue;
    }

    const stationNum = Number(toAsciiDigits(headingMatch[1])) as StationIndex;
    const station = STATIONS.find((item) => item.index === stationNum);
    if (!station) {
      continue;
    }

    const title = headingMatch[2].trim();

    const quoteLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('>')) {
        quoteLines.push(trimmed.replace(/^>\s*/, ''));
      }
    }

    const rawText = quoteLines.join(' ').replace(/\s+/g, ' ').trim();
    if (!rawText) {
      continue;
    }

    parsed.push({
      stationIndex: station.index,
      stationId: station.id,
      title,
      stationStartFrame: station.startFrame,
      stationEndFrame: station.endFrame,
      rawText,
      spokenText: normalizePersianTtsText(rawText),
    });
  }

  parsed.sort((a, b) => a.stationIndex - b.stationIndex);
  return parsed;
}

/**
 * Computes exact frame placement for a station's narration clip so it starts
 * with a clean natural beat and never overflows past `stationEndFrame` or
 * `TOTAL_FRAMES`.
 */
export function computeStationAudioPlacement(
  stationStartFrame: number,
  stationEndFrame: number,
  durationSeconds: number,
  fps: number = FPS,
): AudioPlacement {
  const safeStart = Math.max(0, Math.min(stationStartFrame, TOTAL_FRAMES));
  const safeEnd = Math.max(safeStart, Math.min(stationEndFrame, TOTAL_FRAMES));
  const windowFrames = safeEnd - safeStart;
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0;
  const rawDurationFrames = Math.max(1, Math.ceil(safeDuration * fps));

  const preferredLeadIn = safeStart === 0 ? 4 : 8;
  const preferredTailPad = 6;

  if (rawDurationFrames + preferredLeadIn + preferredTailPad <= windowFrames) {
    const audioStartFrame = safeStart + preferredLeadIn;
    const audioEndFrame = audioStartFrame + rawDurationFrames;
    return {
      audioStartFrame,
      durationFrames: rawDurationFrames,
      audioEndFrame,
      exceedsWindow: false,
      remainingFrames: safeEnd - audioEndFrame,
    };
  }

  if (rawDurationFrames <= windowFrames) {
    const slack = windowFrames - rawDurationFrames;
    const leadIn = Math.min(preferredLeadIn, Math.floor(slack / 2));
    const audioStartFrame = safeStart + leadIn;
    const audioEndFrame = audioStartFrame + rawDurationFrames;
    return {
      audioStartFrame,
      durationFrames: rawDurationFrames,
      audioEndFrame,
      exceedsWindow: false,
      remainingFrames: safeEnd - audioEndFrame,
    };
  }

  // Clamp playback duration to the station window if a clip is longer than its slot.
  return {
    audioStartFrame: safeStart,
    durationFrames: Math.max(1, windowFrames),
    audioEndFrame: safeEnd,
    exceedsWindow: true,
    remainingFrames: 0,
  };
}

/**
 * Schedules all 6 station narration clips sequentially with zero overlap and
 * zero audio truncation. Each clip prefers to start shortly after its
 * `stationStartFrame`, and if a tight intro scene bridges slightly across the
 * camera transition into the next station's arrival window, the following clip
 * shifts smoothly after a clean breath gap while still finishing before its own
 * `stationEndFrame`.
 */
export function scheduleNarrationTracks<
  T extends ParsedScriptSegment & {readonly durationSeconds: number},
>(
  items: readonly T[],
  fps: number = FPS,
): Array<
  T & {
    readonly audioStartFrame: number;
    readonly durationFrames: number;
    readonly audioEndFrame: number;
  }
> {
  const breathGapFrames = 10;
  const scheduled: Array<
    T & {
      readonly audioStartFrame: number;
      readonly durationFrames: number;
      readonly audioEndFrame: number;
    }
  > = [];

  let cursorFrame = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const safeDuration =
      Number.isFinite(item.durationSeconds) && item.durationSeconds > 0
        ? item.durationSeconds
        : 0;
    const durationFrames = Math.max(1, Math.ceil(safeDuration * fps));

    const preferredLeadIn = item.stationStartFrame === 0 ? 4 : 8;
    const earliestByStation = item.stationStartFrame + preferredLeadIn;
    const earliestByPrevious = i === 0 ? 0 : cursorFrame + breathGapFrames;

    let audioStartFrame = Math.max(earliestByStation, earliestByPrevious);

    // If starting at `audioStartFrame` would push past this station's end frame
    // (or TOTAL_FRAMES), pull back up to `earliestByPrevious` so it fits cleanly.
    const maxEndFrame = Math.min(item.stationEndFrame, TOTAL_FRAMES);
    if (audioStartFrame + durationFrames > maxEndFrame) {
      const pulledBack = Math.max(earliestByPrevious, maxEndFrame - durationFrames);
      audioStartFrame = Math.min(audioStartFrame, pulledBack);
    }

    // Never exceed TOTAL_FRAMES
    if (audioStartFrame + durationFrames > TOTAL_FRAMES) {
      audioStartFrame = Math.max(earliestByPrevious, TOTAL_FRAMES - durationFrames);
    }

    const audioEndFrame = Math.min(TOTAL_FRAMES, audioStartFrame + durationFrames);
    const actualDurationFrames = Math.max(1, audioEndFrame - audioStartFrame);

    scheduled.push({
      ...item,
      audioStartFrame,
      durationFrames: actualDurationFrames,
      audioEndFrame,
    });

    cursorFrame = audioEndFrame;
  }

  return scheduled;
}

/**
 * Returns the narration segment currently speaking at `frame`, or `null` during
 * intentional breathing pauses between stations.
 */
export function getActiveNarration(
  frame: number,
  segments: readonly NarrationSegment[],
): NarrationSegment | null {
  if (!Number.isFinite(frame)) {
    return null;
  }
  const clamped = Math.max(0, Math.min(TOTAL_FRAMES, frame));
  for (const segment of segments) {
    if (clamped >= segment.audioStartFrame && clamped < segment.audioEndFrame) {
      return segment;
    }
  }
  return null;
}
