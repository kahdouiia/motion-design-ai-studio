import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, unlinkSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {GoogleGenAI} from '@google/genai';
import {MsEdgeTTS, OUTPUT_FORMAT} from 'msedge-tts';
import {FPS} from '../src/timeline/choreography';
import {
  parseScript75s,
  scheduleNarrationTracks,
  type NarrationProvider,
  type NarrationSegment,
} from '../src/timeline/narration';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const SCRIPT_PATH = path.join(ROOT_DIR, 'docs/script-75s.md');
const PUBLIC_AUDIO_DIR = path.join(ROOT_DIR, 'public/audio');
const MANIFEST_PATH = path.join(ROOT_DIR, 'src/timeline/narrationManifest.ts');

const DEFAULT_EDGE_VOICE = 'fa-IR-FaridNeural';
const DEFAULT_GEMINI_VOICE = 'Charon';
const CONSISTENT_EDGE_RATE_PERCENT = 18;

interface CliOptions {
  readonly provider: NarrationProvider;
  readonly voice: string;
}

function parseCliOptions(): CliOptions {
  const args = process.argv.slice(2);
  let requestedProvider: NarrationProvider | undefined;
  let requestedVoice: string | undefined;

  for (const arg of args) {
    if (arg.startsWith('--provider=')) {
      const value = arg.slice('--provider='.length);
      if (value === 'gemini-tts' || value === 'edge-neural-tts') {
        requestedProvider = value;
      }
    } else if (arg.startsWith('--voice=')) {
      requestedVoice = arg.slice('--voice='.length);
    }
  }

  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY?.trim());
  const provider: NarrationProvider =
    requestedProvider ?? (hasGeminiKey ? 'gemini-tts' : 'edge-neural-tts');
  const voice =
    requestedVoice ??
    (provider === 'gemini-tts' ? DEFAULT_GEMINI_VOICE : DEFAULT_EDGE_VOICE);

  return {provider, voice};
}

function probeDurationSeconds(filePath: string): number {
  const stdout = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ],
    {encoding: 'utf8'},
  ).trim();

  const duration = Number.parseFloat(stdout);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Invalid audio duration measured for ${filePath}: "${stdout}"`);
  }
  return Number(duration.toFixed(3));
}

function postProcessAudio(inputPath: string, outputPath: string, tempoFactor = 1): number {
  // Trim dead leading/trailing silence, normalize broadcast loudness to -16 LUFS
  // (YouTube Shorts / Reels standard), add subtle micro-fade to prevent pops,
  // and encode clean 48kHz 128kbps MP3 for Remotion Studio & Render.
  const filters: string[] = [
    'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:detection=peak',
    'areverse',
    'silenceremove=start_periods=1:start_duration=0.05:start_threshold=-45dB:detection=peak',
    'areverse',
  ];

  if (Math.abs(tempoFactor - 1) > 0.005) {
    filters.push(`atempo=${tempoFactor.toFixed(4)}`);
  }

  filters.push('loudnorm=I=-16:TP=-1.5:LRA=9');
  filters.push('afade=t=in:st=0:d=0.015');

  execFileSync(
    'ffmpeg',
    [
      '-y',
      '-v',
      'error',
      '-i',
      inputPath,
      '-af',
      filters.join(','),
      '-ar',
      '48000',
      '-ac',
      '2',
      '-b:a',
      '128k',
      outputPath,
    ],
    {stdio: 'inherit'},
  );

  return probeDurationSeconds(outputPath);
}

async function synthesizeWithGeminiTts(
  text: string,
  voice: string,
  outWavPath: string,
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required when using gemini-tts provider.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style:
                'Warm, crisp, confident Persian tech explainer narrator for a 75-second vertical engineering video. Natural pacing, clear enunciation.',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {voiceName: voice},
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Gemini TTS did not return audio data.');
  }

  writeFileSync(outWavPath, Buffer.from(base64Audio, 'base64'));
}

async function synthesizeWithEdgeNeuralTts(
  text: string,
  voice: string,
  ratePercent: number,
  outMp3Path: string,
): Promise<void> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

  const rate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`;
  try {
    const {audioStream} = tts.toStream(text, {rate, pitch: '+0Hz'});
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => resolve());
      audioStream.on('error', (err: Error) => reject(err));
    });
    const buffer = Buffer.concat(chunks);
    if (buffer.length === 0) {
      throw new Error('Edge Neural TTS returned an empty audio stream.');
    }
    writeFileSync(outMp3Path, buffer);
  } finally {
    tts.close();
  }
}

async function generateAllStations(): Promise<void> {
  const {provider, voice} = parseCliOptions();
  const markdown = readFileSync(SCRIPT_PATH, 'utf8');
  const parsed = parseScript75s(markdown);

  if (parsed.length !== 6) {
    throw new Error(`Expected 6 stations in docs/script-75s.md, parsed ${parsed.length}.`);
  }

  mkdirSync(PUBLIC_AUDIO_DIR, {recursive: true});
  console.log(`Generating Persian narration for ${parsed.length} stations via ${provider} (${voice})...`);

  const synthesized = [];

  for (const segment of parsed) {
    const windowSeconds = (segment.stationEndFrame - segment.stationStartFrame) / FPS;
    // Station 1 bridges briefly (~0.8s) across the cable descent into Station 2 (frames 240..325),
    // while Station 2 fits inside frames ~275..650 and Stations 3..6 fit strictly inside their slots.
    const maxNaturalSeconds =
      segment.stationIndex === 1
        ? 8.9
        : segment.stationIndex === 2
          ? 12.0
          : Math.max(1, windowSeconds - 0.55);

    const audioRelativePath = `audio/station-${segment.stationIndex}.mp3`;
    const finalPath = path.join(ROOT_DIR, 'public', audioRelativePath);
    const rawExt = provider === 'gemini-tts' ? 'wav' : 'mp3';
    const tempRawPath = path.join(PUBLIC_AUDIO_DIR, `.tmp-station-${segment.stationIndex}.${rawExt}`);

    let ratePercent = segment.stationIndex === 1 ? 26 : CONSISTENT_EDGE_RATE_PERCENT;
    let durationSeconds = 0;

    if (provider === 'edge-neural-tts') {
      const maxAttempts = 4;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await synthesizeWithEdgeNeuralTts(segment.spokenText, voice, ratePercent, tempRawPath);
        durationSeconds = postProcessAudio(tempRawPath, finalPath, 1);

        if (durationSeconds <= maxNaturalSeconds || ratePercent >= 28) {
          break;
        }

        const overshootRatio = durationSeconds / maxNaturalSeconds;
        const delta = Math.max(3, Math.ceil((overshootRatio - 1) * 100));
        ratePercent = Math.min(28, ratePercent + delta);
      }

      // Apply pitch-preserving WSOLA atempo only if the clip still slightly exceeds maxNaturalSeconds
      if (durationSeconds > maxNaturalSeconds) {
        const tempoFactor = Math.min(1.28, durationSeconds / (maxNaturalSeconds - 0.1));
        durationSeconds = postProcessAudio(tempRawPath, finalPath, tempoFactor);
      }
    } else {
      await synthesizeWithGeminiTts(segment.spokenText, voice, tempRawPath);
      durationSeconds = postProcessAudio(tempRawPath, finalPath, 1);
      if (durationSeconds > maxNaturalSeconds) {
        const tempoFactor = Math.min(1.25, durationSeconds / maxNaturalSeconds);
        durationSeconds = postProcessAudio(tempRawPath, finalPath, tempoFactor);
      }
    }

    try {
      unlinkSync(tempRawPath);
    } catch {
      // Ignore cleanup errors on temp file
    }

    synthesized.push({
      ...segment,
      audioFile: audioRelativePath,
      durationSeconds,
      voice,
      provider,
      rate: `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`,
    });
  }

  const manifest: NarrationSegment[] = scheduleNarrationTracks(synthesized, FPS);

  for (const entry of manifest) {
    const windowSeconds = (entry.stationEndFrame - entry.stationStartFrame) / FPS;
    console.log(
      `  Station ${entry.stationIndex} (${entry.stationId}): ${entry.durationSeconds.toFixed(2)}s (slot ${windowSeconds.toFixed(1)}s) | frames ${entry.audioStartFrame}..${entry.audioEndFrame} (rate ${entry.rate})`,
    );
  }

  const manifestSource = `// Auto-generated by scripts/generate-narration.ts from docs/script-75s.md
import type {NarrationSegment} from './narration';

export const NARRATION_TRACKS: readonly NarrationSegment[] = ${JSON.stringify(manifest, null, 2)} as const;
`;

  writeFileSync(MANIFEST_PATH, manifestSource, 'utf8');
  console.log(`\nWrote manifest to ${path.relative(ROOT_DIR, MANIFEST_PATH)}`);
}

generateAllStations().catch((error) => {
  console.error('Failed to generate narration:', error);
  process.exit(1);
});
