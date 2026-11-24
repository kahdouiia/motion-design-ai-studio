import React, {useMemo} from 'react';
import type {ChoreographyState} from '../../timeline/choreography';
import {getStation4State} from '../../timeline/station4';
import {IspRouterNodes} from './IspRouterNodes';
import {LayerStackModel} from './LayerStackModel';

interface Station4SceneProps {
  readonly choreography: ChoreographyState;
}

export const Station4Scene: React.FC<Station4SceneProps> = ({choreography}) => {
  const station4 = useMemo(
    () => getStation4State(choreography.frame),
    [choreography.frame],
  );

  return (
    <group name="station-4-network-layers-and-isp">
      <LayerStackModel station4={station4} />
      <IspRouterNodes station4={station4} />
    </group>
  );
};
