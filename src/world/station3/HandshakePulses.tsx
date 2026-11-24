import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  DATA_CABLE_CONTROL_POINTS,
  evaluateDataCablePoint,
} from '../../timeline/choreography';
import type {Station3State} from '../../timeline/station3';
import {STUDIO_COLORS} from '../palette';

interface HandshakePulsesProps {
  readonly station3: Station3State;
}

const TUNNEL_RING_PROGRESSES = [0.515, 0.565, 0.615, 0.665, 0.715] as const;

export const HandshakePulses: React.FC<HandshakePulsesProps> = ({station3}) => {
  const tunnelAssets = useMemo(() => {
    // Build a smooth sub-curve along the Data Cable from just above Station 3 down toward Station 4
    const samples: THREE.Vector3[] = [];
    const startP = 0.49;
    const endP = 0.76;
    const sampleCount = 36;
    for (let i = 0; i <= sampleCount; i++) {
      const p = startP + (endP - startP) * (i / sampleCount);
      const [x, y, z] = evaluateDataCablePoint(p);
      samples.push(new THREE.Vector3(x, y, z));
    }
    const tunnelCurve = new THREE.CatmullRomCurve3(
      samples,
      false,
      'catmullrom',
      0.5,
    );
    const sleeveGeo = new THREE.TubeGeometry(tunnelCurve, 72, 0.185, 16, false);

    // Precompute oriented shield rings perpendicular to the Data Cable along the encrypted tunnel
    const fullVectors = DATA_CABLE_CONTROL_POINTS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );
    const fullCurve = new THREE.CatmullRomCurve3(
      fullVectors,
      false,
      'catmullrom',
      0.5,
    );
    const zAxis = new THREE.Vector3(0, 0, 1);

    const rings = TUNNEL_RING_PROGRESSES.map((p, index) => {
      const [x, y, z] = evaluateDataCablePoint(p);
      const tangent = fullCurve.getTangent(p).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(zAxis, tangent);
      const euler = new THREE.Euler().setFromQuaternion(quat);
      return {
        index,
        progress: p,
        position: [x, y, z] as const,
        rotation: [euler.x, euler.y, euler.z] as const,
      };
    });

    return {sleeveGeo, rings};
  }, []);

  useEffect(() => {
    return () => {
      tunnelAssets.sleeveGeo.dispose();
    };
  }, [tunnelAssets]);

  const {activePulse, tlsTunnelProgress, frame} = station3;
  const isSynAck = activePulse.stepId === 'syn-ack';
  const pulseColor = isSynAck
    ? STUDIO_COLORS.responseEmerald
    : STUDIO_COLORS.electricBlue;
  const pulseGlow = isSynAck
    ? STUDIO_COLORS.responseEmeraldGlow
    : STUDIO_COLORS.electricBlueGlow;

  return (
    <group name="station-3-handshake-and-tunnel">
      {/* 1. Deterministic TCP 3-Way Handshake Pulse Orb (SYN ↓ / SYN-ACK ↑ / ACK ↓) */}
      {activePulse.active && (
        <group
          name={`tcp-pulse-${activePulse.stepId}`}
          position={[
            activePulse.position[0],
            activePulse.position[1],
            activePulse.position[2],
          ]}
        >
          {/* Bright core orb */}
          <mesh>
            <sphereGeometry args={[0.19, 22, 22]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={pulseColor}
              emissiveIntensity={1.35}
              roughness={0.16}
            />
          </mesh>

          {/* Crisp orbiting directional ring */}
          <mesh rotation={[Math.PI * 0.42, frame * 0.14, 0]}>
            <torusGeometry args={[0.31, 0.04, 14, 34]} />
            <meshStandardMaterial
              color={pulseColor}
              emissive={pulseGlow}
              emissiveIntensity={1.05}
              roughness={0.18}
            />
          </mesh>

          {/* Soft luminous aura */}
          <mesh scale={1 + 0.18 * activePulse.intensity}>
            <sphereGeometry args={[0.39, 18, 18]} />
            <meshBasicMaterial
              color={pulseGlow}
              transparent
              opacity={0.32}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* 2. Encrypted HTTPS Tunnel Sleeve & Spaced Shield Rings (activates as TLS locks) */}
      {tlsTunnelProgress > 0.01 && (
        <group name="https-encrypted-tunnel">
          <mesh geometry={tunnelAssets.sleeveGeo} renderOrder={2}>
            <meshStandardMaterial
              color="#9AD8FF"
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={0.52}
              transparent
              opacity={0.24 * tlsTunnelProgress}
              roughness={0.15}
              metalness={0.1}
              depthWrite={false}
            />
          </mesh>

          {tunnelAssets.rings.map((ring) => {
            const threshold = ring.index * 0.16;
            const ringReveal = Math.max(
              0,
              Math.min(1, (tlsTunnelProgress - threshold) / 0.32),
            );
            if (ringReveal <= 0.01) return null;
            return (
              <mesh
                key={ring.index}
                position={[ring.position[0], ring.position[1], ring.position[2]]}
                rotation={[ring.rotation[0], ring.rotation[1], ring.rotation[2]]}
                scale={0.7 + 0.3 * ringReveal}
                renderOrder={4}
              >
                <torusGeometry args={[0.215, 0.024, 12, 32]} />
                <meshStandardMaterial
                  color="#7CE0FF"
                  emissive={STUDIO_COLORS.electricBlueGlow}
                  emissiveIntensity={0.85}
                  transparent
                  opacity={0.72 * ringReveal}
                  roughness={0.2}
                  depthWrite={false}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
