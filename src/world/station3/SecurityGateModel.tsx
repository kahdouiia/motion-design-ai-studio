import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {Station3State} from '../../timeline/station3';
import {STUDIO_COLORS} from '../palette';
import {createContactShadowTexture} from '../station1/screenTexture';
import {ClayPadlockModel} from './ClayPadlockModel';

interface SecurityGateModelProps {
  readonly station3: Station3State;
}

const LUG_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] as const;

export const SecurityGateModel: React.FC<SecurityGateModelProps> = ({
  station3,
}) => {
  const shadowTexture = useMemo(() => createContactShadowTexture(), []);

  useEffect(() => {
    return () => {
      shadowTexture.dispose();
    };
  }, [shadowTexture]);

  const {
    tcpEstablished,
    gateImpactGlow,
    isTlsLocked,
    keyExchangeProgress,
    innerRingSpin,
    padlockSnapBounce,
  } = station3;

  const innerRingEmissive =
    0.35 +
    0.3 * (tcpEstablished ? 1 : 0) +
    0.5 * gateImpactGlow +
    0.45 * (isTlsLocked ? 1 : 0) +
    padlockSnapBounce * 1.5;

  const innerRingColor = isTlsLocked
    ? STUDIO_COLORS.electricBlue
    : tcpEstablished
      ? STUDIO_COLORS.electricBlueGlow
      : '#7B98F4';

  return (
    <group name="security-gate-assembly">
      {/* 1. Primary Tilted Soft-Clay Security Ring encircling the Data Cable */}
      <group rotation={[Math.PI * 0.37, 0.06, 0.04]} name="security-ring-frame">
        {/* Main porcelain-white clay outer torus ring */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.84, 0.125, 24, 60]} />
          <meshStandardMaterial
            color={STUDIO_COLORS.clayBase}
            emissive="#FFFFFF"
            emissiveIntensity={0.28}
            roughness={0.52}
            metalness={0.02}
          />
        </mesh>

        {/* Slate-lavender beveled structural outer trim band */}
        <mesh position={[0, 0, -0.048]} castShadow receiveShadow>
          <torusGeometry args={[0.87, 0.068, 16, 48]} />
          <meshStandardMaterial
            color={STUDIO_COLORS.clayPrimary}
            emissive="#E8ECF9"
            emissiveIntensity={0.14}
            roughness={0.68}
            metalness={0.04}
          />
        </mesh>

        {/* Inner glowing electric-blue cryptographic energy ring */}
        <mesh>
          <torusGeometry args={[0.66, 0.048, 16, 48]} />
          <meshStandardMaterial
            color={innerRingColor}
            emissive={STUDIO_COLORS.electricBlue}
            emissiveIntensity={innerRingEmissive}
            roughness={0.24}
            metalness={0.1}
          />
        </mesh>

        {/* Counter-rotating segmented TLS Key-Exchange Arcs */}
        <group rotation={[0, 0, innerRingSpin]}>
          <mesh>
            <torusGeometry args={[0.53, 0.026, 12, 32, Math.PI * 0.72]} />
            <meshStandardMaterial
              color={isTlsLocked ? '#7CE0FF' : STUDIO_COLORS.electricBlueGlow}
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={0.65 + 0.5 * keyExchangeProgress}
              transparent
              opacity={0.48 + 0.52 * Math.max(keyExchangeProgress, isTlsLocked ? 1 : 0)}
              roughness={0.22}
            />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.53, 0.026, 12, 32, Math.PI * 0.72]} />
            <meshStandardMaterial
              color={isTlsLocked ? '#7CE0FF' : STUDIO_COLORS.electricBlueGlow}
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={0.65 + 0.5 * keyExchangeProgress}
              transparent
              opacity={0.48 + 0.52 * Math.max(keyExchangeProgress, isTlsLocked ? 1 : 0)}
              roughness={0.22}
            />
          </mesh>
        </group>

        {/* 4 Sculpted Clamping Collar Bands with Raised Glowing Status Studs */}
        {LUG_ANGLES.map((angle, idx) => {
          const lx = Math.cos(angle) * 0.84;
          const ly = Math.sin(angle) * 0.84;
          const studLit =
            isTlsLocked || (tcpEstablished && idx % 2 === 0) || gateImpactGlow > 0.25;
          return (
            <group key={idx} position={[lx, ly, 0]} rotation={[0, 0, angle]}>
              {/* Smooth collar band wrapping cleanly around the torus cross-section */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <torusGeometry args={[0.132, 0.026, 12, 24]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.claySecondary}
                  emissive="#DCE2F5"
                  emissiveIntensity={0.14}
                  roughness={0.6}
                  metalness={0.05}
                />
              </mesh>
              {/* Raised luminous status bead on the top rim of the collar */}
              <mesh position={[0, 0, 0.148]}>
                <sphereGeometry args={[0.036, 14, 14]} />
                <meshStandardMaterial
                  color={studLit ? '#7CE0FF' : STUDIO_COLORS.clayPrimary}
                  emissive={studLit ? STUDIO_COLORS.electricBlue : '#000000'}
                  emissiveIntensity={studLit ? 1.05 : 0}
                  roughness={0.22}
                />
              </mesh>
            </group>
          );
        })}

        {/* Soft Translucent Shield Membrane across Ring Center once TLS Locks */}
        {isTlsLocked && (
          <mesh renderOrder={3}>
            <circleGeometry args={[0.62, 40]} />
            <meshBasicMaterial
              color={STUDIO_COLORS.glassTint}
              transparent
              opacity={0.24 + padlockSnapBounce * 0.5}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* 2. Sleek Porcelain-Clay Bridge Arm docking the Padlock cleanly outside the right rim */}
      <mesh
        position={[0.96, 0.06, 0.06]}
        rotation={[0, -0.22, Math.PI / 2 - 0.12]}
        castShadow
        receiveShadow
      >
        <capsuleGeometry args={[0.072, 0.34, 12, 18]} />
        <meshStandardMaterial
          color={STUDIO_COLORS.clayBase}
          emissive="#F9F9FD"
          emissiveIntensity={0.22}
          roughness={0.55}
          metalness={0.04}
        />
      </mesh>
      {/* Accent collar cuff where bridge arm meets padlock */}
      <mesh position={[1.04, 0.09, 0.12]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.095, 0.095, 0.08, 18]} />
        <meshStandardMaterial
          color={STUDIO_COLORS.claySecondary}
          roughness={0.58}
          metalness={0.06}
        />
      </mesh>

      {/* 3. Glowing Electric-Blue 3D Clay Padlock docked cleanly outside the right rim (zero overlap) */}
      <group
        position={[1.38, 0.15, 0.2]}
        rotation={[0.04, -0.22, -0.02]}
        scale={0.92}
        name="security-gate-padlock-anchor"
      >
        <ClayPadlockModel station3={station3} />
      </group>

      {/* 4. Soft Floating Shadow beneath the Security Gate */}
      <mesh
        position={[0.28, -0.92, -0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[3.2, 1.55]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
