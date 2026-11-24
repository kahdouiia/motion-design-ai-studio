import React, {useEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {
  SMARTPHONE_DIMENSIONS,
  SMARTPHONE_TAP_LOCAL_OFFSET,
  type Station1State,
} from '../../timeline/station1';
import {STUDIO_COLORS} from '../palette';
import {
  createContactShadowTexture,
  createSmartphoneScreenTexture,
  renderSmartphoneScreenCanvas,
} from './screenTexture';

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

function createRoundedRectHole(
  width: number,
  height: number,
  radius: number,
): THREE.Path {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  const path = new THREE.Path();
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function createChainLinkLoopGeometry(): THREE.ExtrudeGeometry {
  const outer = createRoundedRectShape(0.27, 0.165, 0.082);
  const inner = createRoundedRectHole(0.165, 0.072, 0.036);
  outer.holes.push(inner);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.034,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.011,
    bevelSegments: 5,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

interface SmartphoneModelProps {
  readonly station1: Station1State;
}

export const SmartphoneModel: React.FC<SmartphoneModelProps> = ({station1}) => {
  const gl = useThree((state) => state.gl);

  const geometries = useMemo(() => {
    const {
      width,
      height,
      cornerRadius,
      bevelThickness,
      bevelSize,
      screenWidth,
      screenHeight,
      screenCornerRadius,
    } = SMARTPHONE_DIMENSIONS;

    // 1. Primary slate-lavender soft-clay chassis with generous beveled silhouette
    const chassisShape = createRoundedRectShape(
      width - bevelSize * 2,
      height - bevelSize * 2,
      Math.max(0.14, cornerRadius - bevelSize),
    );
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness,
      bevelSize,
      bevelSegments: 8,
      curveSegments: 20,
    });
    chassisGeo.translate(0, 0, -0.11);
    chassisGeo.computeVertexNormals();

    // 2. Subtle inner shadow rim cavity behind the screen
    const rimShape = createRoundedRectShape(
      screenWidth + 0.055,
      screenHeight + 0.055,
      screenCornerRadius + 0.025,
    );
    const rimGeo = new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 4,
      curveSegments: 18,
    });
    rimGeo.translate(0, 0, -0.015);

    // 3. Rounded white ceramic screen slab
    const screenShape = createRoundedRectShape(
      screenWidth - 0.02,
      screenHeight - 0.02,
      screenCornerRadius,
    );
    const screenSlabGeo = new THREE.ExtrudeGeometry(screenShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.014,
      bevelSegments: 5,
      curveSegments: 18,
    });
    screenSlabGeo.translate(0, 0, -0.02);

    // 4. Flat rounded-rect screen face with normalized 0..1 UVs for procedural search bar texture
    const faceShape = createRoundedRectShape(
      screenWidth - 0.03,
      screenHeight - 0.03,
      screenCornerRadius - 0.01,
    );
    const screenFaceGeo = new THREE.ShapeGeometry(faceShape, 18);
    const pos = screenFaceGeo.attributes.position;
    const uvArray = new Float32Array(pos.count * 2);
    const halfW = (screenWidth - 0.03) / 2;
    const halfH = (screenHeight - 0.03) / 2;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const py = pos.getY(i);
      uvArray[i * 2] = (px + halfW) / (halfW * 2);
      uvArray[i * 2 + 1] = (py + halfH) / (halfH * 2);
    }
    screenFaceGeo.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));

    // 5. Left side buttons (pill capsules)
    const sideButtonGeo = new THREE.CapsuleGeometry(0.054, 0.22, 10, 16);

    // 6. 3D interlocking chain-link icon loop
    const linkLoopGeo = createChainLinkLoopGeometry();

    // 7. Glowing horizontal blue tap pill bar
    const pillShape = createRoundedRectShape(0.76, 0.12, 0.06);
    const tapPillGeo = new THREE.ExtrudeGeometry(pillShape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.016,
      bevelSegments: 6,
      curveSegments: 16,
    });
    tapPillGeo.center();

    return {
      chassisGeo,
      rimGeo,
      screenSlabGeo,
      screenFaceGeo,
      sideButtonGeo,
      linkLoopGeo,
      tapPillGeo,
    };
  }, []);

  const screenAssets = useMemo(() => {
    const assets = createSmartphoneScreenTexture();
    const maxAniso = gl.capabilities.getMaxAnisotropy();
    assets.texture.anisotropy = Math.min(8, maxAniso);
    return assets;
  }, [gl]);

  const shadowTexture = useMemo(() => createContactShadowTexture(), []);

  // Re-render procedural screen texture deterministically whenever typing or glow state changes
  useMemo(() => {
    renderSmartphoneScreenCanvas(screenAssets.canvas, {
      typedText: station1.typedText,
      cursorVisible: station1.cursorVisible,
      searchBarHighlight: station1.searchBarHighlight,
      tapImpactGlow: station1.tapImpactGlow,
    });
    screenAssets.texture.needsUpdate = true;
  }, [
    screenAssets,
    station1.typedText,
    station1.cursorVisible,
    station1.searchBarHighlight,
    station1.tapImpactGlow,
  ]);

  useEffect(() => {
    return () => {
      geometries.chassisGeo.dispose();
      geometries.rimGeo.dispose();
      geometries.screenSlabGeo.dispose();
      geometries.screenFaceGeo.dispose();
      geometries.sideButtonGeo.dispose();
      geometries.linkLoopGeo.dispose();
      geometries.tapPillGeo.dispose();
      screenAssets.texture.dispose();
      shadowTexture.dispose();
    };
  }, [geometries, screenAssets, shadowTexture]);

  const [tapX, tapY, tapZ] = SMARTPHONE_TAP_LOCAL_OFFSET;
  const pillPressZ = -0.022 * station1.tapPillPress;
  const pillEmissiveIntensity =
    0.45 + 0.55 * station1.tapImpactGlow + 0.35 * station1.packetLaunchCharge;

  // Screen sits slightly higher in the chassis to create the authentic bottom speaker chin from reference.png
  const screenOffsetY = 0.075;

  const speakerXPositions = [-0.56, -0.44, -0.32, 0.32, 0.44, 0.56] as const;

  return (
    <group name="smartphone-clay-model">
      {/* 1. Primary Soft 3D Clay Chassis */}
      <mesh
        geometry={geometries.chassisGeo}
        castShadow
        receiveShadow
        name="phone-chassis"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.clayPrimary}
          roughness={0.78}
          metalness={0.05}
        />
      </mesh>

      {/* 2. Two Chunky Clay Side Buttons on Left Edge */}
      <mesh
        geometry={geometries.sideButtonGeo}
        position={[-1.02, 0.84, 0.0]}
        castShadow
        receiveShadow
        name="phone-side-button-top"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.claySecondary}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>
      <mesh
        geometry={geometries.sideButtonGeo}
        position={[-1.02, 0.42, 0.0]}
        castShadow
        receiveShadow
        name="phone-side-button-bottom"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.claySecondary}
          roughness={0.68}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Subtle Inner Recessed Bezel Lip */}
      <mesh
        geometry={geometries.rimGeo}
        position={[0, screenOffsetY, 0.175]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#767B96"
          roughness={0.82}
          metalness={0.04}
        />
      </mesh>

      {/* 4. Rounded White Ceramic Screen Base */}
      <mesh
        geometry={geometries.screenSlabGeo}
        position={[0, screenOffsetY, 0.19]}
        receiveShadow
        name="phone-screen-base"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.clayBase}
          emissive="#F9F9FD"
          emissiveIntensity={0.22}
          roughness={0.55}
          metalness={0.02}
        />
      </mesh>

      {/* 5. High-DPI Procedural Screen Face (Search Bar + Typing google.com) */}
      <mesh
        geometry={geometries.screenFaceGeo}
        position={[0, screenOffsetY, 0.228]}
        name="phone-screen-face"
      >
        <meshStandardMaterial
          map={screenAssets.texture}
          emissiveMap={screenAssets.texture}
          emissive="#FFFFFF"
          emissiveIntensity={0.34}
          color="#FFFFFF"
          roughness={0.44}
          metalness={0.02}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>

      {/* 6. Top Front Camera Dot */}
      <group position={[0, screenOffsetY + 1.18, 0.232]} name="phone-front-camera">
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.054, 0.054, 0.012, 20]} />
          <meshStandardMaterial
            color="#484E68"
            roughness={0.45}
            metalness={0.18}
          />
        </mesh>
        <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.008, 16]} />
          <meshStandardMaterial
            color="#262C42"
            roughness={0.15}
            metalness={0.35}
          />
        </mesh>
      </group>

      {/* 7. Bottom Bezel Speaker Dots (3 left + 3 right matching reference.png) */}
      <group position={[0, -1.4, 0.18]} name="phone-speaker-dots">
        {speakerXPositions.map((sx, idx) => (
          <mesh
            key={idx}
            position={[sx, 0, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.034, 0.034, 0.02, 14]} />
            <meshStandardMaterial
              color="#4C526B"
              roughness={0.85}
              metalness={0.05}
            />
          </mesh>
        ))}
      </group>

      {/* 8. 3D Electric-Blue Interlocking Chain-Link Icon (matching reference.png) */}
      <group
        position={[-0.48, tapY + 0.06, 0.246]}
        rotation={[0, 0, Math.PI * 0.25]}
        name="phone-link-icon"
      >
        <mesh
          geometry={geometries.linkLoopGeo}
          position={[-0.125, 0, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={STUDIO_COLORS.electricBlue}
            emissive="#0B3DFF"
            emissiveIntensity={0.42 + 0.25 * station1.tapImpactGlow}
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>
        <mesh
          geometry={geometries.linkLoopGeo}
          position={[0.125, 0, 0.012]}
          castShadow
        >
          <meshStandardMaterial
            color={STUDIO_COLORS.electricBlue}
            emissive="#0B3DFF"
            emissiveIntensity={0.42 + 0.25 * station1.tapImpactGlow}
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>
        {/* Connecting center bridge bar between the two links */}
        <mesh position={[0, 0, 0.016]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.028, 0.11, 8, 12]} />
          <meshStandardMaterial
            color={STUDIO_COLORS.electricBlue}
            emissive="#0B3DFF"
            emissiveIntensity={0.42 + 0.25 * station1.tapImpactGlow}
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>
      </group>

      {/* 9. Glowing Blue Horizontal Tap Pill */}
      <group position={[tapX - 0.27, tapY, tapZ + pillPressZ]} name="phone-tap-pill">
        <mesh geometry={geometries.tapPillGeo} castShadow>
          <meshStandardMaterial
            color={STUDIO_COLORS.electricBlue}
            emissive="#1A5BFF"
            emissiveIntensity={pillEmissiveIntensity}
            roughness={0.26}
            metalness={0.08}
          />
        </mesh>

        {/* Subtle luminous outer halo around the pill on tap / launch */}
        {(station1.tapImpactGlow > 0.02 || station1.packetLaunchCharge > 0.02) && (
          <mesh scale={[1.07, 1.32, 1.25]}>
            <primitive object={geometries.tapPillGeo} attach="geometry" />
            <meshStandardMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={0.65}
              transparent
              opacity={
                0.24 * Math.max(station1.tapImpactGlow, station1.packetLaunchCharge)
              }
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* 10. Expanding Concentric Blue Ripple Rings & Tap Bloom */}
      <group position={[tapX, tapY, tapZ + 0.02]} name="tap-ripple-rings">
        {/* Soft center bloom disc */}
        {(station1.tapImpactGlow > 0.01 || station1.packetLaunchCharge > 0.01) && (
          <mesh renderOrder={4}>
            <circleGeometry
              args={[
                0.26 + 0.14 * Math.max(station1.tapImpactGlow, station1.packetLaunchCharge),
                32,
              ]}
            />
            <meshBasicMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              transparent
              opacity={
                0.28 * Math.max(station1.tapImpactGlow, station1.packetLaunchCharge)
              }
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Concentric crisp blue ripple rings */}
        {station1.ripples.map((ring) => {
          if (!ring.active) return null;
          const thickness = 0.026 - ring.index * 0.004;
          return (
            <group key={ring.index} position={[0, 0, ring.index * 0.006]}>
              {/* Primary crisp ring */}
              <mesh renderOrder={6 + ring.index}>
                <torusGeometry args={[ring.radius, thickness, 12, 48]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.electricBlueGlow}
                  emissive={STUDIO_COLORS.electricBlue}
                  emissiveIntensity={0.72}
                  transparent
                  opacity={ring.opacity}
                  roughness={0.2}
                  depthWrite={false}
                />
              </mesh>
              {/* Soft translucent outer glow halo */}
              <mesh renderOrder={5 + ring.index}>
                <ringGeometry
                  args={[
                    Math.max(0.02, ring.radius - 0.055),
                    ring.radius + 0.055,
                    44,
                  ]}
                />
                <meshBasicMaterial
                  color={STUDIO_COLORS.electricBlueGlow}
                  transparent
                  opacity={ring.opacity * 0.28}
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        })}

        {/* Packet Spawn Energy Burst Ring (frames 176..212 as Packet launches into Data Cable) */}
        {station1.packetSpawnRingProgress > 0 &&
          station1.packetSpawnRingProgress < 1 && (
            <mesh position={[0, 0, 0.025]} renderOrder={10}>
              <torusGeometry
                args={[
                  0.14 + station1.packetSpawnRingProgress * 0.52,
                  0.03 * (1 - station1.packetSpawnRingProgress * 0.65),
                  12,
                  40,
                ]}
              />
              <meshStandardMaterial
                color="#FFFFFF"
                emissive={STUDIO_COLORS.electricBlueGlow}
                emissiveIntensity={1.1}
                transparent
                opacity={(1 - station1.packetSpawnRingProgress) * 0.9}
                depthWrite={false}
              />
            </mesh>
          )}
      </group>

      {/* 11. Soft Grounding Floating Shadow beneath Smartphone */}
      <mesh
        position={[0.05, -1.92, -0.08]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[2.55, 1.25]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.75}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
