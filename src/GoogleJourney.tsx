import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {PersianHud} from './hud/PersianHud';
import {getChoreographyState} from './timeline/choreography';
import {ContinuousWorld} from './world/ContinuousWorld';
import {STUDIO_COLORS} from './world/palette';

export const GoogleJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const choreography = useMemo(() => getChoreographyState(frame), [frame]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${STUDIO_COLORS.bgTop} 0%, ${STUDIO_COLORS.bgBottom} 100%)`,
      }}
    >
      <ContinuousWorld choreography={choreography} />
      <PersianHud choreography={choreography} />
    </AbsoluteFill>
  );
};
