import React, {useMemo} from 'react';
import type {ChoreographyState} from '../../timeline/choreography';
import {getStation5State} from '../../timeline/station5';
import {ServerRackModel} from './ServerRackModel';

interface Station5SceneProps {
  readonly choreography: ChoreographyState;
}

export const Station5Scene: React.FC<Station5SceneProps> = ({choreography}) => {
  const station5 = useMemo(
    () => getStation5State(choreography.frame),
    [choreography.frame],
  );

  return (
    <group name="station-5-server-rack">
      <ServerRackModel station5={station5} />
    </group>
  );
};
