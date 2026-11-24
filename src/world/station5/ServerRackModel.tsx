import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  SERVER_RACK_CENTER,
  SERVER_TOP_PORT_POSITION,
  type ServerTierState,
  type Station5State,
} from '../../timeline/station5';
import {STUDIO_COLORS} from '../palette';
import {createContactShadowTexture} from '../station1/screenTexture';

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

const VENT_OFFSETS_X = [-0.46, -0.32, -0.18] as const;

interface ServerRackModelProps {
  readonly station5: Station5State;
}

export const ServerRackModel: React.FC<ServerRackModelProps> = ({station5}) => {
  const assets = useMemo(() => {
    // 1. Plump porcelain-white rounded rectangular Soft-Clay base pad (matching reference.png)
    const baseShape = createRoundedRectShape(2.48, 1.88, 0.36);
    const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.065,
      bevelSize: 0.065,
      bevelSegments: 8,
      curveSegments: 20,
    });
    baseGeo.rotateX(-Math.PI / 2);
    baseGeo.translate(0, -0.07, 0);
    baseGeo.computeVertexNormals();

    // 2. Matte slate-lavender Soft-Clay server unit chassis (3 stacked tiers)
    const tierShape = createRoundedRectShape(1.94, 1.38, 0.28);
    const tierGeo = new THREE.ExtrudeGeometry(tierShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.072,
      bevelSize: 0.065,
      bevelSegments: 8,
      curveSegments: 20,
    });
    tierGeo.rotateX(-Math.PI / 2);
    tierGeo.translate(0, -0.13, 0);
    tierGeo.computeVertexNormals();

    // 3. Recessed porcelain-white front faceplate inset on each server tier
    const faceplateShape = createRoundedRectShape(1.48, 0.25, 0.08);
    const faceplateGeo = new THREE.ExtrudeGeometry(faceplateShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 4,
      curveSegments: 14,
    });
    faceplateGeo.translate(0, 0, -0.018);
    faceplateGeo.computeVertexNormals();

    const shadowTexture = createContactShadowTexture();

    return {baseGeo, tierGeo, faceplateGeo, shadowTexture};
  }, []);

  useEffect(() => {
    return () => {
      assets.baseGeo.dispose();
      assets.tierGeo.dispose();
      assets.faceplateGeo.dispose();
      assets.shadowTexture.dispose();
    };
  }, [assets]);

  const {
    frame,
    rackFloatY,
    tiers,
    processingCharge,
    isResponseLaunched,
    launchShockwaves,
  } = station5;

  const haloSpin = frame * 0.048;

  return (
    <group name="server-rack-assembly">
      {/* Main 3-Tier Soft-Clay Server Rack rotated gently to match reference.png 3/4 view */}
      <group
        position={[
          SERVER_RACK_CENTER[0],
          rackFloatY,
          SERVER_RACK_CENTER[2],
        ]}
        rotation={[0, -0.26, 0]}
        name="server-rack-body"
      >
        {/* 1. Rounded Porcelain-White Soft-Clay Base Pad */}
        <mesh
          geometry={assets.baseGeo}
          position={[0, -13.86, 0]}
          castShadow
          receiveShadow
          name="server-base-pad"
        >
          <meshStandardMaterial
            color={STUDIO_COLORS.clayBase}
            emissive="#FFFFFF"
            emissiveIntensity={0.28}
            roughness={0.48}
            metalness={0.02}
          />
        </mesh>

        {/* Soft Floating Contact Shadow beneath the White Base Pad */}
        <mesh
          position={[0, -14.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={1}
        >
          <planeGeometry args={[3.35, 2.55]} />
          <meshBasicMaterial
            map={assets.shadowTexture}
            transparent
            opacity={0.58}
            depthWrite={false}
          />
        </mesh>

        {/* 2. Three Stacked Matte Slate-Lavender Soft-Clay Server Tiers */}
        {tiers.map((tier: ServerTierState) => {
          const isActive = tier.status === 'active';
          const ledAccent = tier.isEmerald
            ? STUDIO_COLORS.responseEmerald
            : STUDIO_COLORS.electricBlue;
          const ledGlowAccent = tier.isEmerald
            ? STUDIO_COLORS.responseEmeraldGlow
            : STUDIO_COLORS.electricBlueGlow;

          return (
            <group
              key={tier.id}
              position={[0, tier.tierY, 0]}
              name={`server-tier-${tier.id}`}
            >
              {/* Slate-lavender beveled Soft-Clay server chassis (keeps uniform matte clay tone like reference.png) */}
              <mesh geometry={assets.tierGeo} castShadow receiveShadow>
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayPrimary}
                  emissive={isActive ? ledAccent : '#C6CBE0'}
                  emissiveIntensity={isActive ? 0.08 : 0.09}
                  roughness={0.62}
                  metalness={0.04}
                />
              </mesh>

              {/* Crisp Porcelain-White Front Faceplate */}
              <mesh
                geometry={assets.faceplateGeo}
                position={[0, 0, 0.752]}
                castShadow
                receiveShadow
              >
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayBase}
                  emissive="#FFFFFF"
                  emissiveIntensity={0.3 + tier.ventGlow * 0.14}
                  roughness={0.44}
                  metalness={0.02}
                />
              </mesh>

              {/* 3 Vertical Pill Vent Slots on the left of the white faceplate */}
              {VENT_OFFSETS_X.map((vx, vIdx) => (
                <mesh
                  key={vIdx}
                  position={[vx, 0, 0.778]}
                >
                  <capsuleGeometry args={[0.026, 0.088, 8, 14]} />
                  <meshStandardMaterial
                    color={
                      tier.ventGlow > 0.25
                        ? ledAccent
                        : '#99A1C2'
                    }
                    emissive={ledAccent}
                    emissiveIntensity={0.06 + tier.ventGlow * 0.9}
                    roughness={0.34}
                    metalness={0.06}
                  />
                </mesh>
              ))}

              {/* Glowing Circular LED Ring + Bright White Core Dot on the right (matching reference.png) */}
              <group position={[0.48, 0, 0.776]}>
                {/* Outer luminous blue/emerald LED bezel ring */}
                <mesh>
                  <torusGeometry args={[0.066, 0.028, 14, 28]} />
                  <meshStandardMaterial
                    color={ledAccent}
                    emissive={ledAccent}
                    emissiveIntensity={0.55 + tier.ledIntensity * 1.1}
                    roughness={0.22}
                  />
                </mesh>
                {/* Bright glowing inner core dot */}
                <mesh position={[0, 0, 0.008]}>
                  <sphereGeometry args={[0.042, 16, 16]} />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    emissive="#FFFFFF"
                    emissiveIntensity={0.7 + tier.ledIntensity * 0.85}
                    roughness={0.16}
                  />
                </mesh>
                {/* Soft LED bloom halo when active or launched */}
                {tier.ledIntensity > 0.45 && (
                  <mesh position={[0, 0, 0.015]} renderOrder={5}>
                    <circleGeometry args={[0.145, 24]} />
                    <meshBasicMaterial
                      color={ledGlowAccent}
                      transparent
                      opacity={(tier.ledIntensity - 0.3) * 0.48}
                      depthWrite={false}
                    />
                  </mesh>
                )}
              </group>
            </group>
          );
        })}
      </group>

      {/* 3. Dynamic Processing Energy Halo hovering cleanly above the Top Port while processing */}
      {processingCharge > 0.02 && (
        <group
          position={[
            SERVER_TOP_PORT_POSITION[0],
            SERVER_TOP_PORT_POSITION[1] + 0.34 + rackFloatY,
            SERVER_TOP_PORT_POSITION[2],
          ]}
          scale={0.65 + 0.35 * processingCharge}
          name="server-processing-halo"
        >
          {/* Primary counter-rotating segmented electric-blue / emerald processing arcs */}
          <group rotation={[Math.PI * 0.46, 0, haloSpin]}>
            <mesh>
              <torusGeometry args={[0.52, 0.028, 12, 36, Math.PI * 0.72]} />
              <meshStandardMaterial
                color={
                  station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmerald
                    : STUDIO_COLORS.electricBlue
                }
                emissive={
                  station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmeraldGlow
                    : STUDIO_COLORS.electricBlueGlow
                }
                emissiveIntensity={1.05}
                transparent
                opacity={0.85 * processingCharge}
                roughness={0.2}
                depthWrite={false}
              />
            </mesh>
            <mesh rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.52, 0.028, 12, 36, Math.PI * 0.72]} />
              <meshStandardMaterial
                color={
                  station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmerald
                    : STUDIO_COLORS.electricBlue
                }
                emissive={
                  station5.phase === 'building'
                    ? STUDIO_COLORS.responseEmeraldGlow
                    : STUDIO_COLORS.electricBlueGlow
                }
                emissiveIntensity={1.05}
                transparent
                opacity={0.85 * processingCharge}
                roughness={0.2}
                depthWrite={false}
              />
            </mesh>
          </group>

          {/* Inner pulsing core ring */}
          <mesh rotation={[Math.PI * 0.46, 0, -haloSpin * 1.4]}>
            <torusGeometry args={[0.32, 0.02, 10, 32]} />
            <meshStandardMaterial
              color="#7CE0FF"
              emissive={
                station5.phase === 'building'
                  ? STUDIO_COLORS.responseEmerald
                  : STUDIO_COLORS.electricBlueGlow
              }
              emissiveIntensity={0.95}
              transparent
              opacity={0.72 * processingCharge}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* 4. Concentric Emerald 200 OK Launch Shockwave Rings radiating from the Top Port */}
      <group
        position={[
          SERVER_TOP_PORT_POSITION[0],
          SERVER_TOP_PORT_POSITION[1] + 0.14 + rackFloatY,
          SERVER_TOP_PORT_POSITION[2],
        ]}
        rotation={[Math.PI * 0.41, 0, 0]}
        name="server-launch-shockwaves"
      >
        {launchShockwaves.map((wave) => {
          if (!wave.active) return null;
          const tubeThickness = 0.036 - wave.index * 0.008;
          return (
            <mesh key={wave.index} renderOrder={7 + wave.index}>
              <torusGeometry args={[wave.radius, tubeThickness, 12, 48]} />
              <meshStandardMaterial
                color={
                  wave.index === 0
                    ? '#A7F3D0'
                    : STUDIO_COLORS.responseEmeraldGlow
                }
                emissive={STUDIO_COLORS.responseEmerald}
                emissiveIntensity={1.15}
                transparent
                opacity={wave.opacity}
                roughness={0.2}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Subtle emerald aura dome over top port right after launch */}
      {isResponseLaunched && station5.frame < 1850 && (
        <mesh
          position={[
            SERVER_TOP_PORT_POSITION[0],
            SERVER_TOP_PORT_POSITION[1] + 0.06 + rackFloatY,
            SERVER_TOP_PORT_POSITION[2],
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={3}
        >
          <circleGeometry args={[0.68, 32]} />
          <meshBasicMaterial
            color={STUDIO_COLORS.responseEmeraldGlow}
            transparent
            opacity={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};
