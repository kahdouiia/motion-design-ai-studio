import React from 'react';
import {Composition} from 'remotion';
import {GoogleJourney} from './GoogleJourney';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GoogleJourney"
        component={GoogleJourney}
        durationInFrames={2250}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
