import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import type {Station2State} from '../../timeline/station2';
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

/**
 * Builds a plump Soft 3D Clay teardrop Map Pin with a clean circular through-hole
 * matching `reference.png`. Bottom tip rests at y = 0.
 */
function createMapPinGeometry(): THREE.ExtrudeGeometry {
  const headY = 0.72;
  const R = 0.38;
  const k = 0.55228475 * R;

  const shape = new THREE.Shape();
  // Start at bottom tip (softly rounded)
  shape.moveTo(0, 0.02);
  // Right flank rising smoothly to right equator of pin head
  shape.bezierCurveTo(0.11, 0.16, R, 0.44, R, headY);
  // Top-right quarter circle
  shape.bezierCurveTo(R, headY + k, k, headY + R, 0, headY + R);
  // Top-left quarter circle
  shape.bezierCurveTo(-k, headY + R, -R, headY + k, -R, headY);
  // Left flank sweeping smoothly back down to bottom tip
  shape.bezierCurveTo(-R, 0.44, -0.11, 0.16, 0, 0.02);

  // Circular cutout hole (sized to account for inward bevelSize of 0.075)
  const hole = new THREE.Path();
  hole.absarc(0, headY + 0.01, 0.235, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.095,
    bevelSize: 0.075,
    bevelSegments: 8,
    curveSegments: 28,
  });
  geo.translate(0, 0, -0.07);
  geo.computeVertexNormals();
  return geo;
}

interface DnsPlatformModelProps {
  readonly station2: Station2State;
}

const PILL_IDLE_COLOR = new THREE.Color('#95A7F5');
const PILL_ACTIVE_COLOR = new THREE.Color(STUDIO_COLORS.electricBlue);

export const DnsPlatformModel: React.FC<DnsPlatformModelProps> = ({station2}) => {
  const geometries = useMemo(() => {
    // 1. Floating rounded white clay slab (rotated flat onto XZ plane)
    const slabShape = createRoundedRectShape(2.96, 1.48, 0.34);
    const slabGeo = new THREE.ExtrudeGeometry(slabShape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelThickness: 0.095,
      bevelSize: 0.095,
      bevelSegments: 8,
      curveSegments: 22,
    });
    slabGeo.rotateX(-Math.PI / 2);
    slabGeo.translate(0, -0.13, 0);
    slabGeo.computeVertexNormals();

    // 2. Plump electric-blue 3D Map Pin
    const mapPinGeo = createMapPinGeometry();

    // 3. Two horizontal pill bars matching reference.png (top = domain, bottom = IP)
    const topPillGeo = new THREE.CapsuleGeometry(0.088, 0.92, 12, 22);
    topPillGeo.rotateZ(Math.PI / 2);

    const bottomPillGeo = new THREE.CapsuleGeometry(0.086, 0.74, 12, 22);
    bottomPillGeo.rotateZ(Math.PI / 2);

    return {
      slabGeo,
      mapPinGeo,
      topPillGeo,
      bottomPillGeo,
    };
  }, []);

  const shadowTexture = useMemo(() => createContactShadowTexture(), []);

  useEffect(() => {
    return () => {
      geometries.slabGeo.dispose();
      geometries.mapPinGeo.dispose();
      geometries.topPillGeo.dispose();
      geometries.bottomPillGeo.dispose();
      shadowTexture.dispose();
    };
  }, [geometries, shadowTexture]);

  const topPillColor = useMemo(() => {
    const color = PILL_IDLE_COLOR.clone().lerp(
      PILL_ACTIVE_COLOR,
      station2.topPillGlow * 0.75,
    );
    return `#${color.getHexString()}`;
  }, [station2.topPillGlow]);

  const bottomPillColor = useMemo(() => {
    const color = PILL_IDLE_COLOR.clone().lerp(
      PILL_ACTIVE_COLOR,
      station2.bottomPillGlow,
    );
    return `#${color.getHexString()}`;
  }, [station2.bottomPillGlow]);

  // Top flat deck of the white platform sits at local y = +0.225
  const deckTopY = 0.225;
  const pinLocalX = -0.34;
  const pinLocalZ = 0.06;

  return (
    <group name="dns-platform-model" rotation={[0.04, -0.06, 0]}>
      {/* 1. Floating Rounded White Clay Platform */}
      <mesh
        geometry={geometries.slabGeo}
        castShadow
        receiveShadow
        name="dns-platform-slab"
      >
        <meshStandardMaterial
          color={STUDIO_COLORS.clayBase}
          emissive="#F9F9FD"
          emissiveIntensity={0.22}
          roughness={0.62}
          metalness={0.02}
        />
      </mesh>

      {/* Subtle sculpted recessed top deck inlay ring for tactile clay polish */}
      <mesh
        position={[0, deckTopY + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[2.52, 1.06]} />
        <meshStandardMaterial
          color="#F3F5FD"
          transparent
          opacity={0.35}
          roughness={0.7}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Electric-Blue 3D Map Pin */}
      <group
        name="dns-map-pin"
        position={[pinLocalX, deckTopY + 0.05 + station2.pinBounceY, pinLocalZ]}
        rotation={[0, 0.14, 0]}
        scale={station2.pinScale}
      >
        <mesh geometry={geometries.mapPinGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={STUDIO_COLORS.electricBlue}
            emissive="#0B3DFF"
            emissiveIntensity={station2.pinGlowIntensity}
            roughness={0.28}
            metalness={0.07}
          />
        </mesh>

        {/* Crisp white ceramic inner halo lining inside the pin hole for bright contrast */}
        <mesh position={[0, 0.73, 0]}>
          <torusGeometry args={[0.165, 0.018, 12, 32]} />
          <meshStandardMaterial
            color={STUDIO_COLORS.clayBase}
            emissive="#FFFFFF"
            emissiveIntensity={0.25 + 0.35 * station2.resolvedRevealProgress}
            roughness={0.4}
          />
        </mesh>
      </group>

      {/* Soft contact shadow directly under the Map Pin tip on the white slab */}
      <mesh
        position={[pinLocalX, deckTopY + 0.014, pinLocalZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={2}
      >
        <planeGeometry args={[0.72, 0.56]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* Concentric Blue Lookup / Resolution Radar Ripples on the White Platform */}
      <group position={[pinLocalX, deckTopY + 0.022, pinLocalZ]} name="dns-pin-ripples">
        {station2.ripples.map((ring) => {
          if (!ring.active) return null;
          return (
            <mesh
              key={ring.index}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, ring.index * 0.005, 0]}
              renderOrder={6 + ring.index}
            >
              <ringGeometry
                args={[Math.max(0.04, ring.radius - 0.045), ring.radius, 44]}
              />
              <meshBasicMaterial
                color={STUDIO_COLORS.electricBlueGlow}
                transparent
                opacity={ring.opacity}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          );
        })}
      </group>

      {/* 3. Two Horizontal Pill Bars on the Right Half (matching reference.png) */}
      <group position={[0.68, deckTopY, 0.02]} name="dns-pill-bars">
        {/* Top pill bar — represents domain query (`google.com`) */}
        <mesh
          geometry={geometries.topPillGeo}
          position={[0.04, 0.44, -0.14]}
          castShadow
          receiveShadow
          name="dns-pill-domain"
        >
          <meshStandardMaterial
            color={topPillColor}
            emissive={STUDIO_COLORS.electricBlue}
            emissiveIntensity={0.12 + 0.52 * station2.topPillGlow}
            roughness={0.46 - 0.16 * station2.topPillGlow}
            metalness={0.05}
          />
        </mesh>

        {/* Bottom pill bar — represents resolved IP (`142.250.185.78`) */}
        <mesh
          geometry={geometries.bottomPillGeo}
          position={[-0.05, 0.18, 0.12]}
          castShadow
          receiveShadow
          name="dns-pill-ip"
        >
          <meshStandardMaterial
            color={bottomPillColor}
            emissive={STUDIO_COLORS.electricBlue}
            emissiveIntensity={0.1 + 0.68 * station2.bottomPillGlow}
            roughness={0.46 - 0.18 * station2.bottomPillGlow}
            metalness={0.05}
          />
        </mesh>

        {/* Subtle luminous glow shell around bottom IP pill once resolved */}
        {station2.bottomPillGlow > 0.1 && (
          <mesh
            geometry={geometries.bottomPillGeo}
            position={[-0.05, 0.18, 0.12]}
            scale={[1.06, 1.32, 1.32]}
          >
            <meshBasicMaterial
              color={STUDIO_COLORS.electricBlueGlow}
              transparent
              opacity={0.2 * station2.bottomPillGlow}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Soft grounding shadow below the two horizontal pill bars */}
        <mesh
          position={[0.0, 0.014, 0.04]}
          rotation={[-Math.PI / 2, 0, 0]}
          renderOrder={2}
        >
          <planeGeometry args={[1.3, 0.65]} />
          <meshBasicMaterial
            map={shadowTexture}
            transparent
            opacity={0.42}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* 4. Soft Floating Shadow beneath the DNS Platform */}
      <mesh
        position={[0.04, -0.46, -0.04]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[3.55, 2.05]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.82}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
