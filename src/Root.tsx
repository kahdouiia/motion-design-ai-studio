import React from 'react';
import {Composition} from 'remotion';
import {GoogleJourney} from './GoogleJourney';
import {
  COMPOSITION_HEIGHT,
  COMPOSITION_WIDTH,
  FPS,
  TOTAL_FRAMES,
} from './timeline/choreography';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GoogleJourney"
        component={GoogleJourney}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={COMPOSITION_WIDTH}
        height={COMPOSITION_HEIGHT}
      />
    </>
  );
};
