import React, {useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';
import * as THREE from 'three';
import type {ChoreographyState} from '../timeline/choreography';
import {CameraRig} from './CameraRig';
import {DataCable} from './DataCable';
import {Station1Scene} from './station1/Station1Scene';
import {Station2Scene} from './station2/Station2Scene';
import {Station3Scene} from './station3/Station3Scene';
import {Station4Scene} from './station4/Station4Scene';
import {Station5Scene} from './station5/Station5Scene';
import {StudioEnvironment, StudioLighting} from './StudioLighting';

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const renderer = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);
  } catch {
    return false;
  }
}

interface ContinuousWorldProps {
  readonly choreography: ChoreographyState;
  readonly children?: React.ReactNode;
}

export const ContinuousWorld: React.FC<ContinuousWorldProps> = ({
  choreography,
  children,
}) => {
  const {width, height} = useVideoConfig();
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows={!isSoftwareGl}
      dpr={isSoftwareGl ? 1 : [1, 2]}
      camera={{
        position: [1.7, 12.6, 11.4],
        fov: 42,
        near: 0.1,
        far: 160,
      }}
      gl={{
        antialias: !isSoftwareGl,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.08,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
    >
      <StudioEnvironment />
      <StudioLighting
        focusY={choreography.cameraLookAt[1]}
        isSoftwareGl={isSoftwareGl}
      />
      <CameraRig choreography={choreography} />
      <DataCable choreography={choreography} />
      <Station1Scene choreography={choreography} />
      <Station2Scene choreography={choreography} />
      <Station3Scene choreography={choreography} />
      <Station4Scene choreography={choreography} />
      <Station5Scene choreography={choreography} />
      {children}
    </ThreeCanvas>
  );
};
