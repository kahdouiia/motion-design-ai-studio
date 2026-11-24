import React, {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {STUDIO_COLORS} from './palette';

export const StudioEnvironment: React.FC = () => {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnvironment = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnvironment, 0.04);
    const previousEnvironment = scene.environment;

    scene.environment = envTarget.texture;
    roomEnvironment.dispose();
    pmremGenerator.dispose();

    return () => {
      scene.environment = previousEnvironment;
      envTarget.dispose();
    };
  }, [gl, scene]);

  return null;
};

interface StudioLightingProps {
  readonly focusY: number;
  readonly isSoftwareGl: boolean;
}

export const StudioLighting: React.FC<StudioLightingProps> = ({
  focusY,
  isSoftwareGl,
}) => {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const lightTarget = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    lightTarget.position.set(0, focusY, 0);
    lightTarget.updateMatrixWorld();

    const light = keyLightRef.current;
    if (light) {
      light.target = lightTarget;
      light.target.updateMatrixWorld();
    }
  }, [focusY, lightTarget]);

  return (
    <>
      <fog attach="fog" args={[STUDIO_COLORS.bgBottom, 72, 130]} />
      <primitive object={lightTarget} />

      <ambientLight intensity={0.75} color={STUDIO_COLORS.keyLight} />

      <directionalLight
        ref={keyLightRef}
        position={[-6, focusY + 10, 10]}
        intensity={1.1}
        color={STUDIO_COLORS.keyLight}
        castShadow={!isSoftwareGl}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={42}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      <hemisphereLight
        args={[STUDIO_COLORS.hemiSky, STUDIO_COLORS.hemiGround, 0.55]}
      />

      <directionalLight
        position={[6, focusY - 4, -8]}
        intensity={0.35}
        color={STUDIO_COLORS.rimLight}
      />
    </>
  );
};
