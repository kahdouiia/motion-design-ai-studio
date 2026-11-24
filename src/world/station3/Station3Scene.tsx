import React, {useMemo} from 'react';
import type {ChoreographyState} from '../../timeline/choreography';
import {
  SECURITY_GATE_POSITION,
  getStation3State,
} from '../../timeline/station3';
import {HandshakePulses} from './HandshakePulses';
import {SecurityGateModel} from './SecurityGateModel';

interface Station3SceneProps {
  readonly choreography: ChoreographyState;
}

export const Station3Scene: React.FC<Station3SceneProps> = ({choreography}) => {
  const station3 = useMemo(
    () => getStation3State(choreography.frame),
    [choreography.frame],
  );

  return (
    <group name="station-3-tcp-tls-assembly">
      <group
        position={[
          SECURITY_GATE_POSITION[0],
          SECURITY_GATE_POSITION[1] + station3.gateFloatY,
          SECURITY_GATE_POSITION[2],
        ]}
      >
        <SecurityGateModel station3={station3} />
      </group>

      <HandshakePulses station3={station3} />
    </group>
  );
};
