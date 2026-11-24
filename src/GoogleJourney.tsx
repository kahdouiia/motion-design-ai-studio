import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {loadFont} from '@remotion/google-fonts/Vazirmatn';

const {fontFamily} = loadFont('normal', {
  weights: ['400', '700'],
  subsets: ['arabic', 'latin'],
});

export const GoogleJourney: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #F6F6FB 0%, #ECEEF8 100%)',
        fontFamily,
      }}
    >
      <ThreeCanvas width={width} height={height} shadows dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[-4, 8, 6]} intensity={1.1} castShadow />
        <hemisphereLight args={['#FFFFFF', '#D8DCF0', 0.55]} />
        <mesh rotation={[0.3, frame * 0.02, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 1.6, 1.6]} />
          <meshStandardMaterial color="#8C91AA" roughness={0.78} metalness={0.05} />
        </mesh>
      </ThreeCanvas>

      <AbsoluteFill
        dir="rtl"
        style={{
          padding: '180px 150px 380px 60px',
          pointerEvents: 'none',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: 24,
            padding: '24px 28px',
            border: '1px solid rgba(26, 91, 255, 0.18)',
            color: '#1B1F3B',
          }}
        >
          <div style={{fontSize: 38, fontWeight: 700}}>
            وقتی می‌زنی google.com چه اتفاقی می‌افته؟
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
