import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  ISP_ROUTERS,
  type IspRouterState,
  type Station4State,
} from '../../timeline/station4';
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

interface IspRouterNodesProps {
  readonly station4: Station4State;
}

export const IspRouterNodes: React.FC<IspRouterNodesProps> = ({station4}) => {
  const assets = useMemo(() => {
    // 1. Soft-Clay rounded router chassis body (matches Server Rack & DNS Platform language)
    const bodyShape = createRoundedRectShape(0.84, 0.52, 0.16);
    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.05,
      bevelSegments: 6,
      curveSegments: 16,
    });
    bodyGeo.rotateX(-Math.PI / 2);
    bodyGeo.translate(0, -0.1, 0);
    bodyGeo.computeVertexNormals();

    // 2. Slate-lavender top cap inset
    const capShape = createRoundedRectShape(0.7, 0.4, 0.12);
    const capGeo = new THREE.ExtrudeGeometry(capShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 4,
      curveSegments: 14,
    });
    capGeo.rotateX(-Math.PI / 2);
    capGeo.translate(0, 0.145, 0);
    capGeo.computeVertexNormals();

    // 3. Curved fiber-optic routing relay arcs connecting each ISP router to the Data Cable
    const relayArcs = ISP_ROUTERS.map((router) => {
      const start = new THREE.Vector3(
        router.cablePoint[0],
        router.cablePoint[1],
        router.cablePoint[2],
      );
      const endX =
        router.position[0] + (router.side === 'left' ? 0.44 : -0.44);
      const end = new THREE.Vector3(
        endX,
        router.position[1] + 0.02,
        router.position[2],
      );
      const mid = start.clone().lerp(end, 0.5);
      mid.y += 0.14;
      mid.z += 0.08;

      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.026, 10, false);
      return {curve, tubeGeo};
    });

    const shadowTexture = createContactShadowTexture();

    return {bodyGeo, capGeo, relayArcs, shadowTexture};
  }, []);

  useEffect(() => {
    return () => {
      assets.bodyGeo.dispose();
      assets.capGeo.dispose();
      for (const arc of assets.relayArcs) {
        arc.tubeGeo.dispose();
      }
      assets.shadowTexture.dispose();
    };
  }, [assets]);

  return (
    <group name="isp-router-nodes">
      {station4.routers.map((router: IspRouterState, idx: number) => {
        const isLit = router.status === 'active' || router.status === 'done';
        const bobY =
          Math.sin(station4.frame * 0.045 + idx * 1.9) * 0.02 +
          router.activity * 0.04;
        const arc = assets.relayArcs[idx];

        // Compute pulse orb position along the curved fiber link when router is active
        const pulsePoint =
          router.activity > 0.02
            ? arc.curve.getPoint(router.relayPulse)
            : null;

        return (
          <group key={router.id} name={`isp-node-${router.id}`}>
            {/* Curved routing fiber link from Data Cable to ISP Router */}
            <mesh geometry={arc.tubeGeo} renderOrder={2}>
              <meshStandardMaterial
                color={
                  isLit
                    ? STUDIO_COLORS.electricBlue
                    : STUDIO_COLORS.claySecondary
                }
                emissive={
                  isLit ? STUDIO_COLORS.electricBlueGlow : '#000000'
                }
                emissiveIntensity={
                  router.status === 'active'
                    ? 0.95 + router.activity * 0.65
                    : router.status === 'done'
                      ? 0.55
                      : 0.06
                }
                transparent
                opacity={isLit ? 0.88 : 0.36}
                roughness={0.28}
              />
            </mesh>

            {/* Luminous cable tap bead where fiber link joins the Data Cable */}
            <mesh
              position={[
                router.cablePoint[0],
                router.cablePoint[1],
                router.cablePoint[2],
              ]}
            >
              <sphereGeometry args={[0.105, 16, 16]} />
              <meshStandardMaterial
                color={isLit ? '#7CE0FF' : STUDIO_COLORS.electricBlue}
                emissive={STUDIO_COLORS.electricBlueGlow}
                emissiveIntensity={isLit ? 0.95 : 0.35}
                roughness={0.24}
              />
            </mesh>

            {/* Routing Signal Pulse Orb traveling into the ISP Router */}
            {pulsePoint && (
              <mesh position={[pulsePoint.x, pulsePoint.y, pulsePoint.z]}>
                <sphereGeometry args={[0.095, 16, 16]} />
                <meshStandardMaterial
                  color="#FFFFFF"
                  emissive={STUDIO_COLORS.responseEmeraldGlow}
                  emissiveIntensity={1.4}
                  roughness={0.16}
                />
              </mesh>
            )}

            {/* Minimal 3D Soft-Clay ISP Router Node */}
            <group
              position={[
                router.position[0],
                router.position[1] + bobY,
                router.position[2],
              ]}
              rotation={[0.06, router.side === 'left' ? 0.22 : -0.22, 0]}
              scale={1 + router.activity * 0.05}
            >
              {/* Porcelain-white clay router chassis */}
              <mesh geometry={assets.bodyGeo} castShadow receiveShadow>
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayBase}
                  emissive="#FFFFFF"
                  emissiveIntensity={0.28 + router.activity * 0.16}
                  roughness={0.5}
                  metalness={0.03}
                />
              </mesh>

              {/* Slate-lavender beveled top cover */}
              <mesh geometry={assets.capGeo} castShadow receiveShadow>
                <meshStandardMaterial
                  color={STUDIO_COLORS.clayPrimary}
                  emissive="#E4E9F9"
                  emissiveIntensity={0.14}
                  roughness={0.62}
                  metalness={0.05}
                />
              </mesh>

              {/* Twin Soft-Clay Antennas on back shoulder */}
              {([-0.24, 0.24] as const).map((ax, aIdx) => (
                <group
                  key={aIdx}
                  position={[ax, 0.26, -0.18]}
                  rotation={[-0.12, 0, ax < 0 ? 0.12 : -0.12]}
                >
                  <mesh castShadow>
                    <capsuleGeometry args={[0.032, 0.26, 8, 14]} />
                    <meshStandardMaterial
                      color={STUDIO_COLORS.clayPrimary}
                      emissive="#E4E9F9"
                      emissiveIntensity={0.12}
                      roughness={0.56}
                    />
                  </mesh>
                  {/* Glowing antenna tip orb */}
                  <mesh position={[0, 0.165, 0]}>
                    <sphereGeometry args={[0.044, 14, 14]} />
                    <meshStandardMaterial
                      color={
                        isLit
                          ? STUDIO_COLORS.responseEmeraldGlow
                          : STUDIO_COLORS.claySecondary
                      }
                      emissive={
                        isLit ? STUDIO_COLORS.responseEmerald : '#000000'
                      }
                      emissiveIntensity={
                        isLit ? 0.9 + router.activity * 0.8 : 0
                      }
                      roughness={0.2}
                    />
                  </mesh>
                </group>
              ))}

              {/* 3 Front Face Glowing Status LEDs */}
              {([-0.2, 0, 0.2] as const).map((lx, lIdx) => {
                const ledColor =
                  lIdx === 2
                    ? STUDIO_COLORS.responseEmerald
                    : STUDIO_COLORS.electricBlue;
                const ledOn = isLit || lIdx === 0;
                return (
                  <mesh key={lIdx} position={[lx, 0.02, 0.305]}>
                    <sphereGeometry args={[0.038, 14, 14]} />
                    <meshStandardMaterial
                      color={ledOn ? '#FFFFFF' : STUDIO_COLORS.claySecondary}
                      emissive={ledOn ? ledColor : '#000000'}
                      emissiveIntensity={
                        ledOn ? 0.85 + router.activity * 0.9 : 0
                      }
                      roughness={0.2}
                    />
                  </mesh>
                );
              })}

              {/* Expanding Routing Signal Wave Ring above the Router when active */}
              {router.antennaWave > 0.02 && router.antennaWave < 0.98 && (
                <mesh
                  position={[0, 0.36, -0.16]}
                  rotation={[Math.PI / 2, 0, 0]}
                  renderOrder={5}
                >
                  <torusGeometry
                    args={[
                      0.14 + router.antennaWave * 0.56,
                      0.024 * (1 - router.antennaWave * 0.6),
                      10,
                      32,
                    ]}
                  />
                  <meshStandardMaterial
                    color={STUDIO_COLORS.responseEmeraldGlow}
                    emissive={STUDIO_COLORS.responseEmerald}
                    emissiveIntensity={1.1}
                    transparent
                    opacity={(1 - router.antennaWave) * 0.85}
                    depthWrite={false}
                  />
                </mesh>
              )}

              {/* Subtle Floating Contact Shadow beneath ISP Router */}
              <mesh
                position={[0, -0.34, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                renderOrder={1}
              >
                <planeGeometry args={[1.35, 0.9]} />
                <meshBasicMaterial
                  map={assets.shadowTexture}
                  transparent
                  opacity={0.48}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
};
