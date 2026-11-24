import React, {useMemo} from 'react';
import type {ChoreographyState} from '../../timeline/choreography';
import {
  SMARTPHONE_BASE_POSITION,
  SMARTPHONE_ROTATION,
  getStation1State,
} from '../../timeline/station1';
import {ClayHandPointer} from './ClayHandPointer';
import {SmartphoneModel} from './SmartphoneModel';

interface Station1SceneProps {
  readonly choreography: ChoreographyState;
}

export const Station1Scene: React.FC<Station1SceneProps> = ({choreography}) => {
  const station1 = useMemo(
    () => getStation1State(choreography.frame),
    [choreography.frame],
  );

  // Smooth subtle entrance scale & lift during frames 0..18, fully settled after
  const entranceScale = 0.92 + 0.08 * station1.phoneEntranceProgress;
  const entranceDropY = (1 - station1.phoneEntranceProgress) * -0.25;

  return (
    <group name="station-1-smartphone-assembly">
      <group
        position={[
          SMARTPHONE_BASE_POSITION[0],
          SMARTPHONE_BASE_POSITION[1] + station1.phoneFloatY + entranceDropY,
          SMARTPHONE_BASE_POSITION[2],
        ]}
        rotation={[
          SMARTPHONE_ROTATION[0],
          SMARTPHONE_ROTATION[1] + station1.phoneTiltOffset,
          SMARTPHONE_ROTATION[2],
        ]}
        scale={entranceScale}
      >
        <SmartphoneModel station1={station1} />
      </group>

      <ClayHandPointer station1={station1} />
    </group>
  );
};
