import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  DNS_PACKET_WAIT_POSITION,
  DNS_PIN_WORLD_POSITION,
  type Station2State,
} from '../../timeline/station2';
import {STUDIO_COLORS} from '../palette';

interface ResolverQueryPulseProps {
  readonly station2: Station2State;
}

const HOP_WORLD_POSITIONS: readonly [number, number, number][] = [
  [-0.12, 6.56, -0.32], // Root (.)
  [0.68, 6.9, -0.4],    // .com TLD
  [1.42, 6.46, -0.24],  // Google Authoritative NS
] as const;

export const ResolverQueryPulse: React.FC<ResolverQueryPulseProps> = ({
  station2,
}) => {
  const curves = useMemo(() => {
    const pinTop = new THREE.Vector3(
      DNS_PIN_WORLD_POSITION[0],
      DNS_PIN_WORLD_POSITION[1] + 0.44,
      DNS_PIN_WORLD_POSITION[2],
    );
    const hopVectors = HOP_WORLD_POSITIONS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );

    // Graceful recursive resolver arc from Map Pin through Root -> .com -> Google NS
    const resolverCurve = new THREE.CatmullRomCurve3(
      [pinTop, hopVectors[0], hopVectors[1], hopVectors[2]],
      false,
      'catmullrom',
      0.5,
    );
    const resolverArcGeo = new THREE.TubeGeometry(resolverCurve, 72, 0.024, 10, false);

    // Query spline from waiting Packet into Map Pin
    const packetPos = new THREE.Vector3(
      DNS_PACKET_WAIT_POSITION[0],
      DNS_PACKET_WAIT_POSITION[1],
      DNS_PACKET_WAIT_POSITION[2],
    );
    const queryMid = new THREE.Vector3(
      (packetPos.x + pinTop.x) * 0.5,
      Math.max(packetPos.y, pinTop.y) + 0.24,
      (packetPos.z + pinTop.z) * 0.5 + 0.22,
    );
    const queryCurve = new THREE.QuadraticBezierCurve3(packetPos, queryMid, pinTop);

    // Return spline carrying resolved IP 142.250.185.78 from Map Pin back into Packet
    const returnMid = new THREE.Vector3(
      (packetPos.x + pinTop.x) * 0.5,
      (packetPos.y + pinTop.y) * 0.5 - 0.12,
      (packetPos.z + pinTop.z) * 0.5 + 0.36,
    );
    const returnCurve = new THREE.QuadraticBezierCurve3(pinTop, returnMid, packetPos);
    const returnArcGeo = new THREE.TubeGeometry(returnCurve, 32, 0.022, 8, false);

    return {
      resolverCurve,
      resolverArcGeo,
      queryCurve,
      returnCurve,
      returnArcGeo,
    };
  }, []);

  useEffect(() => {
    return () => {
      curves.resolverArcGeo.dispose();
      curves.returnArcGeo.dispose();
    };
  }, [curves]);

  if (station2.resolverArcOpacity <= 0.01) {
    return null;
  }

  const alpha = station2.resolverArcOpacity;
  const pulsePos = curves.resolverCurve.getPoint(station2.resolverPulseT);
  const queryPos =
    station2.queryBeamProgress > 0 && station2.queryBeamProgress < 1
      ? curves.queryCurve.getPoint(station2.queryBeamProgress)
      : null;
  const returnPos =
    station2.returnPulseProgress > 0 && station2.returnPulseProgress < 1
      ? curves.returnCurve.getPoint(station2.returnPulseProgress)
      : null;

  return (
    <group name="dns-resolver-query-pulse">
      {/* Translucent luminous Resolver Arc connecting Map Pin -> Root -> .com -> Google NS */}
      <mesh geometry={curves.resolverArcGeo}>
        <meshStandardMaterial
          color={STUDIO_COLORS.electricBlueGlow}
          emissive={STUDIO_COLORS.electricBlue}
          emissiveIntensity={0.55}
          transparent
          opacity={0.44 * alpha}
          depthWrite={false}
        />
      </mesh>

      {/* 3 Soft-Clay DNS Hierarchy Satellite Beacons (Root, .com TLD, Google NS) */}
      {station2.hops.map((hop, idx) => {
        const [hx, hy, hz] = HOP_WORLD_POSITIONS[idx];
        const isQuerying = hop.status === 'querying';
        const isResolved = hop.status === 'resolved';
        const nodeScale =
          (0.76 + 0.24 * alpha) * (isQuerying ? 1.15 : isResolved ? 1.06 : 0.94);

        const ringColor = isResolved
          ? STUDIO_COLORS.electricBlue
          : isQuerying
            ? STUDIO_COLORS.electricBlueGlow
            : STUDIO_COLORS.claySecondary;

        return (
          <group
            key={hop.id}
            position={[hx, hy + station2.platformFloatY * 0.7, hz]}
            scale={nodeScale}
            name={`dns-hop-node-${hop.id}`}
          >
            {/* Rounded porcelain clay beacon core */}
            <mesh castShadow>
              <sphereGeometry args={[0.165, 22, 22]} />
              <meshStandardMaterial
                color={STUDIO_COLORS.clayBase}
                emissive="#FFFFFF"
                emissiveIntensity={isResolved ? 0.34 : 0.22}
                roughness={0.45}
                metalness={0.04}
                transparent
                opacity={alpha}
              />
            </mesh>

            {/* Angled glowing status collar ring */}
            <mesh rotation={[Math.PI * 0.28, -0.22, 0.14]}>
              <torusGeometry args={[0.225, 0.038, 12, 32]} />
              <meshStandardMaterial
                color={ringColor}
                emissive={ringColor}
                emissiveIntensity={
                  isResolved ? 0.78 : isQuerying ? 0.95 : 0.08
                }
                roughness={0.28}
                transparent
                opacity={alpha}
              />
            </mesh>

            {/* Inner glowing status jewel on front face */}
            <mesh position={[0, 0, 0.14]}>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshStandardMaterial
                color={
                  isResolved || isQuerying
                    ? STUDIO_COLORS.electricBlue
                    : STUDIO_COLORS.clayPrimary
                }
                emissive={
                  isResolved || isQuerying
                    ? STUDIO_COLORS.electricBlueGlow
                    : '#000000'
                }
                emissiveIntensity={isResolved ? 0.85 : isQuerying ? 1.0 : 0}
                roughness={0.24}
                transparent
                opacity={alpha}
              />
            </mesh>
          </group>
        );
      })}

      {/* Traveling Lookup Pulse Orb along the 3-hop Resolver Arc */}
      {station2.resolverPulseT > 0.01 && station2.resolverPulseT < 0.99 && (
        <group position={[pulsePos.x, pulsePos.y, pulsePos.z]}>
          <mesh>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={STUDIO_COLORS.electricBlue}
              emissiveIntensity={1.1}
              roughness={0.18}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              transparent
              opacity={0.32 * alpha}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Incoming Query Pulse from Waiting Packet into Map Pin */}
      {queryPos && (
        <group position={[queryPos.x, queryPos.y, queryPos.z]}>
          <mesh>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={1.0}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.21, 16, 16]} />
            <meshBasicMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              transparent
              opacity={0.3 * alpha}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Return Path & Glowing IP Resolution Pulse back into the Packet */}
      {station2.isResolved && (
        <mesh geometry={curves.returnArcGeo}>
          <meshBasicMaterial
            color={STUDIO_COLORS.electricBlueGlow}
            transparent
            opacity={0.34 * alpha}
            depthWrite={false}
          />
        </mesh>
      )}

      {returnPos && (
        <group
          position={[returnPos.x, returnPos.y, returnPos.z]}
          name="dns-ip-return-pulse"
        >
          <mesh>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={STUDIO_COLORS.electricBlue}
              emissiveIntensity={1.15}
              roughness={0.18}
            />
          </mesh>
          <mesh rotation={[Math.PI * 0.3, station2.frame * 0.12, 0]}>
            <torusGeometry args={[0.21, 0.026, 10, 28]} />
            <meshStandardMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              emissive={STUDIO_COLORS.electricBlueGlow}
              emissiveIntensity={0.9}
              roughness={0.2}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshBasicMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              transparent
              opacity={0.28 * alpha}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
