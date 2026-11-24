# 0001. Use `@remotion/three` with an HTML/CSS Persian HUD Overlay

- **Status**: accepted

We render the 3D world using `@remotion/three` (React Three Fiber inside Remotion) and place all Persian RTL text, titles, and callouts in an HTML/CSS `<AbsoluteFill>` HUD overlay above the `<ThreeCanvas>`.

## Considered Options

- **Standalone Three.js in plain HTML**: Lacks deterministic frame-by-frame MP4 rendering (`useCurrentFrame()`) and timeline/audio synchronization.
- **WebGL 3D text (`troika-three-text` / `Text3D`)**: Suffers from Persian/Arabic RTL shaping, ligature, and bidirectional text issues.

## Consequences

- Every 3D animation must be driven deterministically from Remotion's `useCurrentFrame()` (no `requestAnimationFrame` or `useFrame` delta clocks).
- Persian typography stays sharp at 1080×1920 using standard CSS RTL layout and web fonts.
