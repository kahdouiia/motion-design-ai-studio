import React, {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {
  LAYER_STACK_CENTER_X,
  LAYER_STACK_CENTER_Z,
  type NetworkLayerState,
  type Station4State,
} from '../../timeline/station4';
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

function createRoundedFrameShape(
  outerW: number,
  outerH: number,
  outerR: number,
  innerW: number,
  innerH: number,
  innerR: number,
): THREE.Shape {
  const shape = createRoundedRectShape(outerW, outerH, outerR);
  const hole = new THREE.Path();
  const x = -innerW / 2;
  const y = -innerH / 2;
  const r = Math.min(innerR, innerW / 2, innerH / 2);

  hole.moveTo(x + r, y);
  hole.lineTo(x + innerW - r, y);
  hole.quadraticCurveTo(x + innerW, y, x + innerW, y + r);
  hole.lineTo(x + innerW, y + innerH - r);
  hole.quadraticCurveTo(x + innerW, y + innerH, x + innerW - r, y + innerH);
  hole.lineTo(x + r, y + innerH);
  hole.quadraticCurveTo(x, y + innerH, x, y + innerH - r);
  hole.lineTo(x, y + r);
  hole.quadraticCurveTo(x, y, x + r, y);

  shape.holes.push(hole);
  return shape;
}

function createLayerBadgeTexture(
  badgeTitle: string,
  accentColor: string,
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soft white-tinted rounded badge background
  const pad = 10;
  const w = canvas.width - pad * 2;
  const h = canvas.height - pad * 2;
  const r = 34;

  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(pad + w - r, pad);
  ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + r);
  ctx.lineTo(pad + w, pad + h - r);
  ctx.quadraticCurveTo(pad + w, pad + h, pad + w - r, pad + h);
  ctx.lineTo(pad + r, pad + h);
  ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - r);
  ctx.lineTo(pad, pad + r);
  ctx.quadraticCurveTo(pad, pad, pad + r, pad);
  ctx.closePath();

  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Leading colored indicator dot
  ctx.beginPath();
  ctx.arc(66, canvas.height / 2, 18, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  // Crisp bold monospace-style layer title
  ctx.fillStyle = '#1B1F3B';
  ctx.font = '800 54px "JetBrains Mono", "Inter", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeTitle, 104, canvas.height / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const PLATE_WIDTH = 2.66;
const PLATE_DEPTH = 1.54;
const PLATE_CORNER_RADIUS = 0.28;

const CORNER_PIN_OFFSETS = [
  [-1.08, -0.54],
  [1.08, -0.54],
  [-1.08, 0.54],
  [1.08, 0.54],
] as const;

interface LayerStackModelProps {
  readonly station4: Station4State;
}

export const LayerStackModel: React.FC<LayerStackModelProps> = ({station4}) => {
  const assets = useMemo(() => {
    // 1. Hollow beveled Soft-Clay outer rim frame (lies flat in XZ once rotated -PI/2 around X)
    const frameShape = createRoundedFrameShape(
      PLATE_WIDTH,
      PLATE_DEPTH,
      PLATE_CORNER_RADIUS,
      PLATE_WIDTH - 0.34,
      PLATE_DEPTH - 0.34,
      0.16,
    );
    const frameGeo = new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.095,
      bevelEnabled: true,
      bevelThickness: 0.036,
      bevelSize: 0.034,
      bevelSegments: 6,
      curveSegments: 18,
    });
    frameGeo.rotateX(-Math.PI / 2);
    frameGeo.translate(0, -0.0475, 0);
    frameGeo.computeVertexNormals();

    // 2. Translucent frosted-glass inner pane slab
    const paneShape = createRoundedRectShape(
      PLATE_WIDTH - 0.28,
      PLATE_DEPTH - 0.28,
      0.18,
    );
    const paneGeo = new THREE.ExtrudeGeometry(paneShape, {
      depth: 0.048,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 16,
    });
    paneGeo.rotateX(-Math.PI / 2);
    paneGeo.translate(0, -0.024, 0);
    paneGeo.computeVertexNormals();

    // 3. Canvas badge textures for the 4 layers (APP, TCP, IP, LINK)
    const badgeTextures = station4.layers.map((layer) =>
      createLayerBadgeTexture(layer.badgeTitle, layer.ringColor),
    );

    return {frameGeo, paneGeo, badgeTextures};
    // Build once — layer definitions (badgeTitle & ringColor) are static constants
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      assets.frameGeo.dispose();
      assets.paneGeo.dispose();
      for (const tex of assets.badgeTextures) {
        tex?.dispose();
      }
    };
  }, [assets]);

  const topY = station4.layers[0].plateY;
  const bottomY = station4.layers[station4.layers.length - 1].plateY;
  const columnHeight = topY - bottomY;
  const columnMidY = (topY + bottomY) / 2;

  return (
    <group
      name="network-layer-stack"
      position={[0, station4.stackFloatY, 0]}
    >
      {/* Subtle vertical slate-lavender structural corner guide rods uniting all 4 plates */}
      <group position={[LAYER_STACK_CENTER_X, columnMidY, LAYER_STACK_CENTER_Z]}>
        {CORNER_PIN_OFFSETS.map(([cx, cz], idx) => (
          <mesh key={idx} position={[cx, 0, cz]}>
            <cylinderGeometry args={[0.024, 0.024, columnHeight, 12]} />
            <meshStandardMaterial
              color={STUDIO_COLORS.claySecondary}
              emissive="#DCE2F5"
              emissiveIntensity={0.18}
              roughness={0.55}
              metalness={0.08}
              transparent
              opacity={0.58}
            />
          </mesh>
        ))}
      </group>

      {/* 4 Translucent Glass & Soft-Clay Layer Plates */}
      {station4.layers.map((layer: NetworkLayerState, idx: number) => {
        const isLit = layer.status === 'active' || layer.status === 'done';
        const activeBoost =
          layer.platePulse * 0.95 + (layer.status === 'done' ? 0.28 : 0);
        const plateLiftY = layer.platePulse * 0.032;

        // Exact Data Cable piercing offset relative to this plate's center
        const boreLocalX = layer.cablePoint[0] - LAYER_STACK_CENTER_X;
        const boreLocalZ = layer.cablePoint[2] - LAYER_STACK_CENTER_Z;
        const badgeTex = assets.badgeTextures[idx];

        return (
          <group
            key={layer.id}
            name={`layer-plate-${layer.id}`}
            position={[
              LAYER_STACK_CENTER_X,
              layer.plateY + plateLiftY,
              LAYER_STACK_CENTER_Z,
            ]}
          >
            {/* 1. Porcelain-white Soft-Clay beveled outer frame */}
            <mesh
              geometry={assets.frameGeo}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color={STUDIO_COLORS.clayBase}
                emissive={isLit ? layer.plateTint : '#FFFFFF'}
                emissiveIntensity={0.28 + activeBoost * 0.24}
                roughness={0.48}
                metalness={0.03}
              />
            </mesh>

            {/* 2. Frosted translucent glass inner pane tinted by layer accent */}
            <mesh geometry={assets.paneGeo} renderOrder={2}>
              <meshStandardMaterial
                color={layer.plateTint}
                emissive={layer.ringGlow}
                emissiveIntensity={0.18 + activeBoost * 0.52}
                transparent
                opacity={0.44 + layer.platePulse * 0.16}
                roughness={0.16}
                metalness={0.08}
                depthWrite={false}
              />
            </mesh>

            {/* 3. Front color-coded accent bar along front-right bevel */}
            <mesh
              position={[0.42, 0.0, PLATE_DEPTH / 2 + 0.025]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <capsuleGeometry args={[0.026, 0.92, 8, 16]} />
              <meshStandardMaterial
                color={layer.ringColor}
                emissive={layer.ringGlow}
                emissiveIntensity={isLit ? 0.85 + layer.platePulse * 0.6 : 0.3}
                roughness={0.24}
              />
            </mesh>

            {/* 4. Crisp front-left 3D Layer Label Plaque (L4 APP / L3 TCP / L2 IP / L1 LINK) */}
            {badgeTex && (
              <mesh
                position={[-0.78, 0.012, PLATE_DEPTH / 2 + 0.044]}
                renderOrder={5}
              >
                <planeGeometry args={[0.74, 0.185]} />
                <meshBasicMaterial
                  map={badgeTex}
                  transparent
                  depthWrite={false}
                />
              </mesh>
            )}

            {/* 5. Precision Cable Pass-Through Aperture Collar aligned to Data Cable */}
            <group position={[boreLocalX, 0, boreLocalZ]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.21, 0.044, 14, 36]} />
                <meshStandardMaterial
                  color={isLit ? layer.ringColor : STUDIO_COLORS.claySecondary}
                  emissive={isLit ? layer.ringGlow : '#000000'}
                  emissiveIntensity={
                    isLit ? 0.65 + layer.platePulse * 0.95 : 0.05
                  }
                  roughness={0.26}
                  metalness={0.08}
                />
              </mesh>

              {/* Soft inner halo ring around cable aperture */}
              <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={4}>
                <torusGeometry args={[0.31, 0.018, 10, 32]} />
                <meshBasicMaterial
                  color={layer.ringGlow}
                  transparent
                  opacity={isLit ? 0.45 + layer.platePulse * 0.45 : 0.12}
                  depthWrite={false}
                />
              </mesh>

              {/* Expanding Encapsulation Ripple Ring across the plate when Packet crosses */}
              {layer.rippleProgress > 0 && (
                <mesh
                  rotation={[Math.PI / 2, 0, 0]}
                  position={[0, 0.03, 0]}
                  renderOrder={6}
                >
                  <torusGeometry
                    args={[
                      0.26 + layer.rippleProgress * 0.88,
                      0.034 * (1 - layer.rippleProgress * 0.65),
                      12,
                      44,
                    ]}
                  />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    emissive={layer.ringColor}
                    emissiveIntensity={1.2}
                    transparent
                    opacity={(1 - layer.rippleProgress) * 0.92}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>

            {/* 4 Corner Ceramic Collar Caps */}
            {CORNER_PIN_OFFSETS.map(([cx, cz], cIdx) => (
              <mesh key={cIdx} position={[cx, 0.058, cz]}>
                <cylinderGeometry args={[0.055, 0.058, 0.036, 14]} />
                <meshStandardMaterial
                  color={isLit ? layer.ringGlow : STUDIO_COLORS.claySecondary}
                  emissive={isLit ? layer.ringColor : '#000000'}
                  emissiveIntensity={isLit ? 0.55 : 0}
                  roughness={0.35}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
