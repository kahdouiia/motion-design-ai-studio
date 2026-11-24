import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {Station3State} from '../../timeline/station3';
import {STUDIO_COLORS} from '../palette';

function createRoundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/**
 * Creates a smooth U-shaped 3D padlock shackle whose right leg is anchored
 * near local `(0, 0, 0)` so pivoting around the right leg swings the shackle
 * open naturally in 3D space.
 */
function createShackleGeometry(): THREE.TubeGeometry {
  const halfSpan = 0.21;
  const legHeight = 0.24;
  const archRadius = halfSpan;

  const points: THREE.Vector3[] = [];
  // Extended right hinge leg (anchored deep inside padlock body even when lifted open)
  points.push(new THREE.Vector3(0, -0.28, 0));
  points.push(new THREE.Vector3(0, -0.06, 0));
  points.push(new THREE.Vector3(0, legHeight * 0.5, 0));
  points.push(new THREE.Vector3(0, legHeight, 0));

  // Smooth semicircular top arch centered at (-halfSpan, legHeight, 0)
  const archSteps = 16;
  for (let i = 1; i <= archSteps; i++) {
    const theta = (i / archSteps) * Math.PI;
    const x = -halfSpan + Math.cos(theta) * archRadius;
    const y = legHeight + Math.sin(theta) * archRadius;
    points.push(new THREE.Vector3(x, y, 0));
  }

  // Shorter left locking leg that lifts cleanly clear of the left bore when open
  points.push(new THREE.Vector3(-halfSpan * 2, legHeight * 0.52, 0));
  points.push(new THREE.Vector3(-halfSpan * 2, 0.01, 0));

  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.25);
  return new THREE.TubeGeometry(curve, 52, 0.058, 16, false);
}

interface ClayPadlockModelProps {
  readonly station3: Station3State;
}

export const ClayPadlockModel: React.FC<ClayPadlockModelProps> = ({station3}) => {
  const geometries = useMemo(() => {
    // 1. Plump beveled Soft 3D Clay padlock body
    const bodyShape = createRoundedRectShape(0.68, 0.56, 0.14);
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.075,
      bevelSize: 0.065,
      bevelSegments: 8,
      curveSegments: 20,
    });
    bodyGeo.translate(0, 0, -0.1);
    bodyGeo.computeVertexNormals();

    // 2. Subtle front face inset frame
    const bezelShape = createRoundedRectShape(0.54, 0.43, 0.11);
    const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 4,
      curveSegments: 16,
    });
    bezelGeo.translate(0, 0, -0.01);

    // 3. Articulated U-shackle pivoted at right leg
    const shackleGeo = createShackleGeometry();

    // 4. Tapered keyhole lower slot
    const slotShape = new THREE.Shape();
    slotShape.moveTo(-0.036, 0.0);
    slotShape.lineTo(0.036, 0.0);
    slotShape.lineTo(0.052, -0.135);
    slotShape.lineTo(-0.052, -0.135);
    slotShape.closePath();
    const keyholeSlotGeo = new THREE.ExtrudeGeometry(slotShape, {
      depth: 0.026,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 3,
    });
    keyholeSlotGeo.translate(0, 0, -0.013);

    return {
      bodyGeo,
      bezelGeo,
      shackleGeo,
      keyholeSlotGeo,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometries.bodyGeo.dispose();
      geometries.bezelGeo.dispose();
      geometries.shackleGeo.dispose();
      geometries.keyholeSlotGeo.dispose();
    };
  }, [geometries]);

  const {shackleCloseProgress, padlockSnapBounce, isTlsLocked, keyExchangeProgress} =
    station3;

  // Shackle starts lifted + rotated open (right leg stays physically seated in hinge bore)
  const openRatio = 1 - shackleCloseProgress;
  const shackleLiftY = 0.2 * openRatio;
  const shackleSwingY = -0.56 * Math.max(0, (openRatio - 0.16) / 0.84);

  // Subtle squash & pop when shackle locks shut
  const bodyScaleX = 1 + padlockSnapBounce * 0.45;
  const bodyScaleY = 1 - padlockSnapBounce * 0.35;

  const lockBodyEmissiveIntensity =
    0.34 +
    0.22 * keyExchangeProgress +
    (isTlsLocked ? 0.36 : 0) +
    padlockSnapBounce * 2.2;

  const keyholeGlow = isTlsLocked
    ? 0.95 + padlockSnapBounce * 2.5
    : 0.25 + 0.4 * keyExchangeProgress;

  return (
    <group
      name="tls-clay-padlock"
      scale={[bodyScaleX, bodyScaleY, 1 + padlockSnapBounce * 0.2]}
    >
      {/* 1. Articulated Metallic-Clay U-Shackle pivoted at right leg (+0.21, +0.28, 0) */}
      <group
        position={[0.21, 0.28 + shackleLiftY, 0]}
        rotation={[0, shackleSwingY, 0]}
        name="padlock-shackle"
      >
        <mesh geometry={geometries.shackleGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color="#E8EEFA"
            emissive={isTlsLocked ? STUDIO_COLORS.electricBlueGlow : '#DCE4F8'}
            emissiveIntensity={isTlsLocked ? 0.36 : 0.22}
            roughness={0.28}
            metalness={0.22}
          />
        </mesh>
      </group>

      {/* Shackle collar sockets on top edge of padlock body */}
      <mesh position={[0.21, 0.34, 0]}>
        <cylinderGeometry args={[0.088, 0.092, 0.04, 18]} />
        <meshStandardMaterial
          color={STUDIO_COLORS.claySecondary}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>
      <mesh position={[-0.21, 0.34, 0]}>
        <cylinderGeometry args={[0.088, 0.092, 0.04, 18]} />
        <meshStandardMaterial
          color={STUDIO_COLORS.claySecondary}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      {/* 2. Primary Glowing Electric-Blue Clay Lock Body */}
      <mesh
        geometry={geometries.bodyGeo}
        castShadow
        receiveShadow
        name="padlock-body"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.electricBlue}
          emissive="#0B3DFF"
          emissiveIntensity={lockBodyEmissiveIntensity}
          roughness={0.32}
          metalness={0.08}
        />
      </mesh>

      {/* 3. Subtle Front Trim Frame */}
      <mesh geometry={geometries.bezelGeo} position={[0, -0.01, 0.168]}>
        <meshStandardMaterial
          color="#2E6BFF"
          emissive={STUDIO_COLORS.electricBlueGlow}
          emissiveIntensity={0.24 + (isTlsLocked ? 0.25 : 0)}
          roughness={0.28}
          metalness={0.08}
        />
      </mesh>

      {/* 4. Glowing Porcelain-White Keyhole Emblem */}
      <group position={[0, 0.025, 0.19]} name="padlock-keyhole">
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.072, 0.072, 0.028, 22]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={isTlsLocked ? '#A5F3FC' : '#FFFFFF'}
            emissiveIntensity={keyholeGlow}
            roughness={0.24}
          />
        </mesh>
        <mesh geometry={geometries.keyholeSlotGeo} position={[0, -0.025, 0]}>
          <meshStandardMaterial
            color="#FFFFFF"
            emissive={isTlsLocked ? '#A5F3FC' : '#FFFFFF'}
            emissiveIntensity={keyholeGlow}
            roughness={0.24}
          />
        </mesh>
      </group>

      {/* 5. Soft Outer Luminous Shield Halo once TLS Locks */}
      {isTlsLocked && (
        <mesh scale={[1.1, 1.12, 1.18]}>
          <primitive object={geometries.bodyGeo} attach="geometry" />
          <meshBasicMaterial
            color={STUDIO_COLORS.electricBlueGlow}
            transparent
            opacity={0.18 + padlockSnapBounce * 0.9}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 6. Expanding Lock-Snap Shockwave Rings radiating cleanly from Padlock */}
      <group position={[0, 0.02, 0.22]} name="padlock-lock-shockwaves">
        {station3.shockwaves.map((wave) => {
          if (!wave.active) return null;
          const tubeThickness = 0.032 - wave.index * 0.006;
          return (
            <group key={wave.index} position={[0, 0, wave.index * 0.012]}>
              <mesh renderOrder={8 + wave.index}>
                <torusGeometry args={[wave.radius, tubeThickness, 12, 48]} />
                <meshStandardMaterial
                  color={wave.index === 0 ? '#A5F3FC' : STUDIO_COLORS.electricBlueGlow}
                  emissive={STUDIO_COLORS.electricBlue}
                  emissiveIntensity={0.95}
                  transparent
                  opacity={wave.opacity}
                  roughness={0.2}
                  depthWrite={false}
                />
              </mesh>
              <mesh renderOrder={7 + wave.index}>
                <ringGeometry
                  args={[Math.max(0.03, wave.radius - 0.06), wave.radius + 0.06, 44]}
                />
                <meshBasicMaterial
                  color={STUDIO_COLORS.electricBlueGlow}
                  transparent
                  opacity={wave.opacity * 0.26}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
};
