import React, {useMemo} from 'react';
import type {ChoreographyState} from '../../timeline/choreography';
import {
  DNS_PLATFORM_POSITION,
  getStation2State,
} from '../../timeline/station2';
import {DnsPlatformModel} from './DnsPlatformModel';
import {ResolverQueryPulse} from './ResolverQueryPulse';

interface Station2SceneProps {
  readonly choreography: ChoreographyState;
}

export const Station2Scene: React.FC<Station2SceneProps> = ({choreography}) => {
  const station2 = useMemo(
    () => getStation2State(choreography.frame),
    [choreography.frame],
  );

  return (
    <group name="station-2-dns-assembly">
      <group
        position={[
          DNS_PLATFORM_POSITION[0],
          DNS_PLATFORM_POSITION[1] + station2.platformFloatY,
          DNS_PLATFORM_POSITION[2],
        ]}
      >
        <DnsPlatformModel station2={station2} />
      </group>

      <ResolverQueryPulse station2={station2} />
    </group>
  );
};
