import React from 'react';
import {
  TAP_WORLD_ANCHOR,
  type Station1State,
} from '../../timeline/station1';

interface ClayHandPointerProps {
  readonly station1: Station1State;
}

const CLAY_SKIN_COLOR = '#FFBDA0';
const CLAY_SKIN_SHADOW = '#F3A586';
const CLAY_NAIL_COLOR = '#FFD7C4';

/**
 * Composite Soft 3D Clay hand entering from the right edge of the viewport,
 * with extended pointing index finger positioned so the fingertip rests at
 * local `[0, 0, 0]` (touching `TAP_WORLD_ANCHOR` on impact).
 */
export const ClayHandPointer: React.FC<ClayHandPointerProps> = ({station1}) => {
  if (!station1.fingerVisible) {
    return null;
  }

  const [offsetX, offsetY, offsetZ] = station1.fingerLocalOffset;
  const tapPitch = 0.06 * station1.fingerPressDepth;
  const tapRoll = -0.04 * station1.fingerPressDepth;

  return (
    <group
      name="clay-hand-pointer"
      position={[
        TAP_WORLD_ANCHOR[0] + offsetX,
        TAP_WORLD_ANCHOR[1] + offsetY + station1.phoneFloatY,
        TAP_WORLD_ANCHOR[2] + offsetZ,
      ]}
      rotation={[tapPitch, -0.14, 0.04 + tapRoll]}
    >
      {/* 1. Extended Index Finger — rounded fingertip anchored cleanly at [0, 0, 0] */}
      <group position={[0.14, 0, 0.08]} rotation={[0, 0.14, 0]}>
        {/* Distal fingertip segment */}
        <mesh
          position={[0.42, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <capsuleGeometry args={[0.165, 0.84, 14, 24]} />
          <meshStandardMaterial
            color={CLAY_SKIN_COLOR}
            emissive="#E88159"
            emissiveIntensity={0.07}
            roughness={0.72}
            metalness={0.02}
          />
        </mesh>

        {/* Subtle glossy soft-clay fingernail accent on upper-front tip */}
        <mesh
          position={[0.04, 0.135, 0.04]}
          rotation={[0.25, 0, 0.12]}
          scale={[1.25, 0.32, 0.88]}
        >
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial
            color={CLAY_NAIL_COLOR}
            roughness={0.34}
            metalness={0.02}
          />
        </mesh>

        {/* Knuckle bridge into palm */}
        <mesh
          position={[1.02, -0.02, -0.02]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          receiveShadow
        >
          <capsuleGeometry args={[0.2, 0.48, 12, 20]} />
          <meshStandardMaterial
            color={CLAY_SKIN_COLOR}
            emissive="#E88159"
            emissiveIntensity={0.07}
            roughness={0.74}
            metalness={0.02}
          />
        </mesh>
      </group>

      {/* 2. Soft Sculpted Clay Palm */}
      <mesh
        position={[1.72, -0.1, 0.0]}
        scale={[1.28, 0.94, 0.8]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.56, 26, 22]} />
        <meshStandardMaterial
          color={CLAY_SKIN_COLOR}
          emissive="#E88159"
          emissiveIntensity={0.07}
          roughness={0.74}
          metalness={0.02}
        />
      </mesh>

      {/* 3. Curled Middle Finger tucked softly below index finger (matching reference.png) */}
      <mesh
        position={[1.18, -0.34, 0.14]}
        rotation={[0.2, 0.15, -0.58]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.175, 0.44, 12, 20]} />
        <meshStandardMaterial
          color={CLAY_SKIN_SHADOW}
          emissive="#DE7852"
          emissiveIntensity={0.06}
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>

      {/* 4. Curled Ring Finger */}
      <mesh
        position={[1.42, -0.49, 0.11]}
        rotation={[0.24, 0.14, -0.62]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.17, 0.42, 12, 20]} />
        <meshStandardMaterial
          color={CLAY_SKIN_SHADOW}
          emissive="#DE7852"
          emissiveIntensity={0.06}
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>

      {/* 5. Curled Pinky Finger */}
      <mesh
        position={[1.68, -0.58, 0.07]}
        rotation={[0.28, 0.12, -0.66]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.16, 0.36, 12, 20]} />
        <meshStandardMaterial
          color={CLAY_SKIN_SHADOW}
          emissive="#DE7852"
          emissiveIntensity={0.06}
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>

      {/* 6. Soft Tucked Inner Palm Bridge (smooths upper contour into index knuckle) */}
      <mesh
        position={[1.38, 0.08, 0.12]}
        rotation={[0.08, -0.15, 1.38]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.21, 0.36, 12, 20]} />
        <meshStandardMaterial
          color={CLAY_SKIN_COLOR}
          emissive="#E88159"
          emissiveIntensity={0.07}
          roughness={0.73}
          metalness={0.02}
        />
      </mesh>

      {/* 7. Smooth Wrist Extending Off the Right Edge */}
      <mesh
        position={[2.65, -0.18, -0.06]}
        rotation={[0, 0, Math.PI / 2 - 0.05]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.42, 1.35, 14, 22]} />
        <meshStandardMaterial
          color={CLAY_SKIN_COLOR}
          emissive="#E88159"
          emissiveIntensity={0.07}
          roughness={0.76}
          metalness={0.02}
        />
      </mesh>
    </group>
  );
};
