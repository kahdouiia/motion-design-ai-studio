import React from 'react';
import {Audio} from '@remotion/media';
import {staticFile} from 'remotion';
import {NARRATION_TRACKS} from '../timeline/narrationManifest';

export interface NarrationTrackProps {
  readonly volume?: number;
  readonly muted?: boolean;
}

const [track1, track2, track3, track4, track5, track6] = NARRATION_TRACKS;

/**
 * Mounts each station's Persian voiceover as an explicit `<Audio>` track so
 * Remotion Studio displays all 6 synchronized waveforms across the 75-second
 * timeline without collapsing them as programmatically duplicated instances.
 */
export const NarrationTrack: React.FC<NarrationTrackProps> = ({
  volume = 1,
  muted = false,
}) => {
  return (
    <>
      {track1 && (
        <Audio
          name={`نریشن ایستگاه ۱: ${track1.title}`}
          src={staticFile(track1.audioFile)}
          from={track1.audioStartFrame}
          durationInFrames={track1.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
      {track2 && (
        <Audio
          name={`نریشن ایستگاه ۲: ${track2.title}`}
          src={staticFile(track2.audioFile)}
          from={track2.audioStartFrame}
          durationInFrames={track2.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
      {track3 && (
        <Audio
          name={`نریشن ایستگاه ۳: ${track3.title}`}
          src={staticFile(track3.audioFile)}
          from={track3.audioStartFrame}
          durationInFrames={track3.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
      {track4 && (
        <Audio
          name={`نریشن ایستگاه ۴: ${track4.title}`}
          src={staticFile(track4.audioFile)}
          from={track4.audioStartFrame}
          durationInFrames={track4.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
      {track5 && (
        <Audio
          name={`نریشن ایستگاه ۵: ${track5.title}`}
          src={staticFile(track5.audioFile)}
          from={track5.audioStartFrame}
          durationInFrames={track5.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
      {track6 && (
        <Audio
          name={`نریشن ایستگاه ۶: ${track6.title}`}
          src={staticFile(track6.audioFile)}
          from={track6.audioStartFrame}
          durationInFrames={track6.durationFrames}
          volume={volume}
          muted={muted}
        />
      )}
    </>
  );
};
