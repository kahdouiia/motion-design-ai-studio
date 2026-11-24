import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  DATA_CABLE_CONTROL_POINTS,
  type ChoreographyState,
  type StationIndex,
  type Vec3,
} from '../timeline/choreography';
import {getStation1State} from '../timeline/station1';
import {getStation2State} from '../timeline/station2';
import {getStation3State} from '../timeline/station3';
import {getStation4State} from '../timeline/station4';
import {
  SERVER_TOP_PORT_POSITION,
  getStation5State,
} from '../timeline/station5';
import {getStation6State} from '../timeline/station6';
import {STUDIO_COLORS} from './palette';

interface StationAnchorNode {
  readonly stationIndices: readonly StationIndex[];
  readonly position: Vec3;
}

const STATION_ANCHOR_NODES: readonly StationAnchorNode[] = [
  {stationIndices: [1, 6], position: DATA_CABLE_CONTROL_POINTS[0]},
  {stationIndices: [2], position: DATA_CABLE_CONTROL_POINTS[3]},
  {stationIndices: [3], position: DATA_CABLE_CONTROL_POINTS[5]},
  {stationIndices: [4], position: DATA_CABLE_CONTROL_POINTS[7]},
  {stationIndices: [5], position: DATA_CABLE_CONTROL_POINTS[9]},
];

interface DataCableProps {
  readonly choreography: ChoreographyState;
}

export const DataCable: React.FC<DataCableProps> = ({choreography}) => {
  const {coreGeometry, haloGeometry} = useMemo(() => {
    const vectors = DATA_CABLE_CONTROL_POINTS.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z),
    );
    const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
    return {
      coreGeometry: new THREE.TubeGeometry(curve, 180, 0.082, 16, false),
      haloGeometry: new THREE.TubeGeometry(curve, 180, 0.145, 14, false),
    };
  }, []);

  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      haloGeometry.dispose();
    };
  }, [coreGeometry, haloGeometry]);

  const station1 = useMemo(
    () => getStation1State(choreography.frame),
    [choreography.frame],
  );
  const station2 = useMemo(
    () => getStation2State(choreography.frame),
    [choreography.frame],
  );
  const station3 = useMemo(
    () => getStation3State(choreography.frame),
    [choreography.frame],
  );
  const station4 = useMemo(
    () => getStation4State(choreography.frame),
    [choreography.frame],
  );
  const station5 = useMemo(
    () => getStation5State(choreography.frame),
    [choreography.frame],
  );
  const station6 = useMemo(
    () => getStation6State(choreography.frame),
    [choreography.frame],
  );

  const isInbound = choreography.packetDirection === 'inbound';
  const packetCoreColor = isInbound
    ? STUDIO_COLORS.responseEmerald
    : STUDIO_COLORS.electricBlue;
  const packetGlowColor = isInbound
    ? STUDIO_COLORS.responseEmeraldGlow
    : STUDIO_COLORS.electricBlueGlow;

  const pulseWave = Math.sin(choreography.frame * 0.16);
  const packetHaloScale = 1 + 0.08 * pulseWave;
  const packetRingSpin = choreography.frame * 0.07;
  const packetVisibilityScale =
    Math.min(1, Math.max(0, choreography.packetProgress / 0.012)) *
    station5.packetDockScale;
  const cableBoost =
    0.42 +
    0.26 * station1.tapImpactGlow +
    0.34 * station1.packetLaunchCharge;

  return (
    <group name="data-cable-assembly">
      {/* Primary electric-blue Data Cable */}
      <mesh geometry={coreGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={STUDIO_COLORS.electricBlue}
          emissive="#0B3DFF"
          emissiveIntensity={cableBoost}
          roughness={0.32}
          metalness={0.06}
        />
      </mesh>

      {/* Soft luminous outer sheath */}
      <mesh geometry={haloGeometry}>
        <meshStandardMaterial
          color={STUDIO_COLORS.electricBlueGlow}
          emissive={STUDIO_COLORS.electricBlueGlow}
          emissiveIntensity={0.32 + 0.25 * station1.packetLaunchCharge}
          transparent
          opacity={0.16 + 0.08 * station1.packetLaunchCharge}
          roughness={0.22}
          depthWrite={false}
        />
      </mesh>

      {/* Glowing port anchor rings at each vertical Station coordinate */}
      {STATION_ANCHOR_NODES.map((node, idx) => {
        const isActive = node.stationIndices.includes(choreography.stationIndex);
        const isSmartphoneNode = node.stationIndices.includes(1);
        const isDnsNode = node.stationIndices.includes(2);
        const isSecurityGateNode = node.stationIndices.includes(3);
        const isLayerStackNode = node.stationIndices.includes(4);
        const isServerRackNode = node.stationIndices.includes(5);
        const [x, y, z] = node.position;

        if (isSmartphoneNode) {
          const isEmeraldArrival = station6.packetArrived;
          const portScale =
            1.0 +
            0.16 * station1.tapImpactGlow +
            0.28 * station1.packetLaunchCharge +
            0.34 * station6.arrivalGlow;
          return (
            <group key={idx} position={[x, y, z]} scale={portScale}>
              {/* Smooth rounded junction hub cleanly enclosing the Data Cable start */}
              <mesh>
                <sphereGeometry args={[0.118, 24, 24]} />
                <meshStandardMaterial
                  color={
                    isEmeraldArrival
                      ? STUDIO_COLORS.responseEmerald
                      : STUDIO_COLORS.electricBlue
                  }
                  emissive={
                    isEmeraldArrival
                      ? STUDIO_COLORS.responseEmeraldGlow
                      : STUDIO_COLORS.electricBlueGlow
                  }
                  emissiveIntensity={
                    0.5 +
                    0.5 * station1.tapImpactGlow +
                    0.75 * station1.packetLaunchCharge +
                    0.95 * station6.arrivalGlow
                  }
                  roughness={0.25}
                  metalness={0.06}
                />
              </mesh>
            </group>
          );
        }

        if (isDnsNode) {
          const dnsPortScale =
            0.94 +
            0.1 * (station2.isResolved ? 1 : 0) +
            0.04 * (isActive ? pulseWave : 0);
          return (
            <group
              key={idx}
              position={[x, y + 0.07 + station2.platformFloatY, z + 0.06]}
              scale={dnsPortScale}
            >
              {/* Bright porcelain-white core + electric-blue collar seated proudly on the DNS Platform front-left bevel (matching reference.png) */}
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.16, 24, 24]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayBase}
                  emissive="#FFFFFF"
                  emissiveIntensity={0.42 + 0.35 * station2.bottomPillGlow}
                  roughness={0.34}
                  metalness={0.04}
                />
              </mesh>
              <mesh rotation={[0.14, -0.1, 0]}>
                <torusGeometry args={[0.215, 0.062, 16, 36]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.electricBlue}
                  emissive="#0B3DFF"
                  emissiveIntensity={0.5 + 0.38 * station2.bottomPillGlow}
                  roughness={0.28}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        }

        if (isSecurityGateNode) {
          const gateHubScale =
            1 +
            0.18 * station3.gateImpactGlow +
            0.08 * (station3.isTlsLocked ? 1 : 0);
          return (
            <group
              key={idx}
              position={[x, y + station3.gateFloatY, z]}
              scale={gateHubScale}
            >
              {/* Compact luminous port hub centered inside the SecurityGateModel ring */}
              <mesh>
                <sphereGeometry args={[0.13, 20, 20]} />
                <meshStandardMaterial
                  color={station3.isTlsLocked ? '#7CE0FF' : STUDIO_COLORS.electricBlue}
                  emissive={
                    station3.isTlsLocked
                      ? '#38BDF8'
                      : STUDIO_COLORS.electricBlueGlow
                  }
                  emissiveIntensity={
                    0.55 +
                    0.75 * station3.gateImpactGlow +
                    (station3.isTlsLocked ? 0.5 : 0)
                  }
                  roughness={0.22}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        }

        if (isLayerStackNode) {
          const networkLayer = station4.layers[2];
          const hubScale = 1 + 0.2 * networkLayer.platePulse;
          return (
            <group
              key={idx}
              position={[x, y + station4.stackFloatY, z]}
              scale={hubScale}
            >
              {/* Compact luminous hub integrated inside Plate 3 (Network) aperture */}
              <mesh>
                <sphereGeometry args={[0.115, 18, 18]} />
                <meshStandardMaterial
                  color={
                    networkLayer.status === 'idle'
                      ? STUDIO_COLORS.electricBlue
                      : networkLayer.ringColor
                  }
                  emissive={networkLayer.ringGlow}
                  emissiveIntensity={0.55 + networkLayer.platePulse * 0.95}
                  roughness={0.22}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        }

        if (isServerRackNode) {
          const isEmeraldPort =
            station5.isResponseLaunched || station5.phase === 'building';
          const portAccent = isEmeraldPort
            ? STUDIO_COLORS.responseEmerald
            : STUDIO_COLORS.electricBlue;
          const portGlow = isEmeraldPort
            ? STUDIO_COLORS.responseEmeraldGlow
            : STUDIO_COLORS.electricBlueGlow;
          const serverPortScale =
            1 +
            0.18 * station5.intakeGlow +
            0.08 * station5.processingCharge;
          return (
            <group
              key={idx}
              position={[
                SERVER_TOP_PORT_POSITION[0],
                SERVER_TOP_PORT_POSITION[1] + station5.rackFloatY + 0.02,
                SERVER_TOP_PORT_POSITION[2],
              ]}
              scale={serverPortScale}
            >
              {/* Iconic reference.png bright porcelain-white core + crisp saturated collar seated flush on Tier 1 top */}
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[0.125, 24, 24]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayBase}
                  emissive="#FFFFFF"
                  emissiveIntensity={
                    0.55 +
                    0.4 * station5.intakeGlow +
                    0.25 * station5.processingCharge
                  }
                  roughness={0.28}
                  metalness={0.04}
                />
              </mesh>
              <mesh rotation={[Math.PI * 0.34, 0, 0]}>
                <torusGeometry args={[0.185, 0.06, 16, 36]} />
                <meshStandardMaterial
                  color={portAccent}
                  emissive={isEmeraldPort ? '#059669' : '#0B3DFF'}
                  emissiveIntensity={
                    0.52 +
                    0.55 * station5.intakeGlow +
                    0.35 * station5.processingCharge
                  }
                  roughness={0.26}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        }

        const ringScale = isActive ? 1.1 + 0.04 * pulseWave : 1.0;
        return (
          <group key={idx} position={[x, y, z]} scale={ringScale}>
            {/* Ceramic white core port */}
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[0.24, 24, 24]} />
              <meshStandardMaterial
                color={STUDIO_COLORS.clayBase}
                emissive={isActive ? STUDIO_COLORS.electricBlueGlow : '#000000'}
                emissiveIntensity={isActive ? 0.2 : 0}
                roughness={0.48}
                metalness={0.04}
              />
            </mesh>

            {/* Electric-blue outer collar ring */}
            <mesh rotation={[Math.PI * 0.18, 0, 0]}>
              <torusGeometry args={[0.32, 0.08, 16, 36]} />
              <meshStandardMaterial
                color={STUDIO_COLORS.electricBlue}
                emissive="#0B3DFF"
                emissiveIntensity={isActive ? 0.55 : 0.32}
                roughness={0.3}
                metalness={0.08}
              />
            </mesh>

            {/* Subtle soft-clay pedestal ring to ground each Station anchor */}
            <mesh position={[0, -0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.62, 0.035, 12, 36]} />
              <meshStandardMaterial
                color={STUDIO_COLORS.claySecondary}
                roughness={0.78}
                metalness={0.05}
                transparent
                opacity={isActive ? 0.65 : 0.32}
              />
            </mesh>
          </group>
        );
      })}

      {/* Deterministic 3D Packet traveling along the Data Cable */}
      {packetVisibilityScale > 0.01 && (
        <group
          name="data-packet"
          position={[
            choreography.packetPosition[0],
            choreography.packetPosition[1],
            choreography.packetPosition[2],
          ]}
          scale={packetVisibilityScale}
        >
          {/* Inner glowing Packet core */}
          <mesh castShadow>
            <sphereGeometry args={[0.26, 24, 24]} />
            <meshStandardMaterial
              color={STUDIO_COLORS.clayBase}
              emissive={packetCoreColor}
              emissiveIntensity={0.8}
              roughness={0.22}
              metalness={0.1}
            />
          </mesh>

          {/* Orbiting energy ring */}
          <mesh rotation={[Math.PI * 0.35, packetRingSpin, Math.PI * 0.15]}>
            <torusGeometry args={[0.42, 0.048, 14, 36]} />
            <meshStandardMaterial
              color={packetCoreColor}
              emissive={packetGlowColor}
              emissiveIntensity={0.7}
              roughness={0.26}
              metalness={0.1}
            />
          </mesh>

          {/* Secondary Resolved-IP Halo Ring added after Station 2 DNS Resolution */}
          {station2.packetIpAttached > 0.02 && !isInbound && (
            <mesh
              rotation={[-Math.PI * 0.32, -packetRingSpin * 0.85, Math.PI * 0.25]}
              scale={station2.packetIpAttached}
            >
              <torusGeometry args={[0.52, 0.034, 12, 36]} />
              <meshStandardMaterial
                color="#7CE0FF"
                emissive={STUDIO_COLORS.electricBlueGlow}
                emissiveIntensity={0.95}
                roughness={0.2}
                metalness={0.12}
              />
            </mesh>
          )}

          {/* DNS IP-Attached Lock-in Burst Ring around the Packet */}
          {station2.packetIpBurstProgress > 0 &&
            station2.packetIpBurstProgress < 1 && (
              <mesh>
                <torusGeometry
                  args={[
                    0.3 + station2.packetIpBurstProgress * 0.56,
                    0.035 * (1 - station2.packetIpBurstProgress * 0.7),
                    12,
                    36,
                  ]}
                />
                <meshStandardMaterial
                  color="#FFFFFF"
                  emissive={STUDIO_COLORS.electricBlueGlow}
                  emissiveIntensity={1.1}
                  transparent
                  opacity={(1 - station2.packetIpBurstProgress) * 0.9}
                  depthWrite={false}
                />
              </mesh>
            )}

          {/* TLS 1.3 Encrypted Crystalline Shield Shell acquired at Station 3 */}
          {station3.packetTlsEncrypted > 0.02 && !isInbound && (
            <group
              scale={station3.packetTlsEncrypted}
              rotation={[
                choreography.frame * 0.022,
                -choreography.frame * 0.032,
                Math.PI * 0.12,
              ]}
            >
              {/* Faceted crystalline protective geodesic shell (softens slightly as 4 header rings wrap) */}
              <mesh>
                <icosahedronGeometry args={[0.56, 0]} />
                <meshStandardMaterial
                  color="#7CE0FF"
                  emissive="#2563EB"
                  emissiveIntensity={0.8}
                  transparent
                  opacity={
                    0.22 *
                    station3.packetTlsEncrypted *
                    (1 - 0.52 * (station4.encapsulatedCount / 4))
                  }
                  roughness={0.14}
                  metalness={0.18}
                  depthWrite={false}
                />
              </mesh>
              {/* Crisp luminous encryption lattice wireframe */}
              <mesh>
                <icosahedronGeometry args={[0.575, 0]} />
                <meshBasicMaterial
                  color="#BAE6FD"
                  wireframe
                  transparent
                  opacity={
                    0.56 *
                    station3.packetTlsEncrypted *
                    (1 - 0.58 * (station4.encapsulatedCount / 4))
                  }
                  depthWrite={false}
                />
              </mesh>
            </group>
          )}

          {/* Station 4: Distinct Colored Network Encapsulation Header Rings (APP / TCP / IP / LINK) */}
          {station4.showEncapsulationRings && !isInbound && (
            <group name="packet-encapsulation-rings">
              {station4.layers.map((layer) => {
                if (layer.ringAcquired <= 0.02) return null;
                const spinDir = layer.index % 2 === 0 ? 1 : -1;
                const tiltX = Math.PI * (0.28 + layer.index * 0.14);
                const tiltZ = (layer.index - 1.5) * 0.34;
                const ringSpin =
                  choreography.frame * (0.042 + layer.index * 0.008) * spinDir;
                const popScale =
                  layer.ringAcquired * (1 + 0.16 * layer.platePulse);
                return (
                  <mesh
                    key={layer.id}
                    rotation={[tiltX, ringSpin, tiltZ]}
                    scale={popScale}
                  >
                    <torusGeometry
                      args={[layer.ringRadius, 0.048, 14, 44]}
                    />
                    <meshStandardMaterial
                      color={layer.ringColor}
                      emissive={layer.ringColor}
                      emissiveIntensity={0.5 + layer.platePulse * 0.65}
                      roughness={0.24}
                      metalness={0.1}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {/* Station 5: Emerald 200 OK Response Payload Assembly (HTML / CSS / JS orbs) */}
          {isInbound && station5.responsePayloadScale > 0.02 && (
            <group
              name="packet-response-payload"
              scale={station5.responsePayloadScale}
            >
              {/* Secondary luminous emerald response ring */}
              <mesh
                rotation={[
                  -Math.PI * 0.34,
                  -packetRingSpin * 0.9,
                  Math.PI * 0.22,
                ]}
              >
                <torusGeometry args={[0.56, 0.04, 14, 42]} />
                <meshStandardMaterial
                  color={STUDIO_COLORS.responseEmerald}
                  emissive={STUDIO_COLORS.responseEmeraldGlow}
                  emissiveIntensity={0.85}
                  roughness={0.22}
                  metalness={0.1}
                />
              </mesh>

              {/* 3 Orbiting Payload Orbs representing HTML / CSS / JS assets */}
              {(
                [
                  {color: '#1A5BFF', angleOffset: 0},
                  {color: '#0284C7', angleOffset: (Math.PI * 2) / 3},
                  {color: '#F59E0B', angleOffset: (Math.PI * 4) / 3},
                ] as const
              ).map((orb, oIdx) => {
                const theta = choreography.frame * 0.095 + orb.angleOffset;
                const r = 0.62;
                return (
                  <mesh
                    key={oIdx}
                    position={[
                      Math.cos(theta) * r,
                      Math.sin(theta * 1.2) * 0.22,
                      Math.sin(theta) * r,
                    ]}
                  >
                    <sphereGeometry args={[0.092, 16, 16]} />
                    <meshStandardMaterial
                      color={orb.color}
                      emissive={orb.color}
                      emissiveIntensity={0.75}
                      roughness={0.22}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {/* Soft translucent Packet aura */}
          <mesh scale={packetHaloScale}>
            <sphereGeometry args={[0.48, 20, 20]} />
            <meshStandardMaterial
              color={packetGlowColor}
              emissive={packetGlowColor}
              emissiveIntensity={0.42}
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
