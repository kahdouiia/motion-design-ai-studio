import React, {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import type {ChoreographyState} from '../timeline/choreography';

interface CameraRigProps {
  readonly choreography: ChoreographyState;
}

export const CameraRig: React.FC<CameraRigProps> = ({choreography}) => {
  const camera = useThree((state) => state.camera);
  const [posX, posY, posZ] = choreography.cameraPosition;
  const [lookX, lookY, lookZ] = choreography.cameraLookAt;
  const {cameraFov} = choreography;

  useLayoutEffect(() => {
    camera.position.set(posX, posY, posZ);
    camera.lookAt(lookX, lookY, lookZ);

    if (camera instanceof THREE.PerspectiveCamera) {
      if (Math.abs(camera.fov - cameraFov) > 1e-4) {
        camera.fov = cameraFov;
        camera.updateProjectionMatrix();
      }
    }

    camera.updateMatrixWorld();
  }, [camera, posX, posY, posZ, lookX, lookY, lookZ, cameraFov]);

  return null;
};
