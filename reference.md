# Visual & Technical Reference (`reference.png`)

This document captures the visual language, color palette, lighting, 3D materials, spatial layout, and Shorts safe-zone rules derived from `reference.png` for the Remotion + `@remotion/three` implementation.

## 1. Format & Viewport

- **Resolution**: `1080 × 1920` (9:16 vertical, YouTube Shorts / Reels)
- **Frame rate**: `30 fps`
- **Duration**: `75 seconds` (`2250 frames`)

## 2. Color Palette

| Role | Hex | Usage |
| --- | --- | --- |
| Studio Background | `#F6F6FB` → `#ECEEF8` | Soft radial/vertical off-white lavender studio backdrop |
| Clay Primary Body | `#8C91AA` | Smartphone outer bezel, server chassis |
| Clay Secondary / Rim | `#A7ACC2` | Side buttons, vents, subtle bevel highlights |
| Clay Base / Platform | `#F9F9FD` | Floating white rounded platforms, phone screen base |
| Electric Blue (Primary) | `#1A5BFF` | Data Cable, DNS Map Pin, active LEDs, Packet core |
| Electric Blue (Glow) | `#4D88FF` | Emissive halo, tap ripple rings, packet trail |
| Text Primary (HUD) | `#1B1F3B` | Persian titles and body text on light cards |
| Text Muted (HUD) | `#5A6180` | Secondary labels and technical subtitles |
| Glass Layer Tint | `#DCE6FF` | Translucent 4-layer network stack plates |

## 3. Lighting & Materials (Soft 3D Clay)

- **Renderer**: `@remotion/three` (`<ThreeCanvas shadows dpr={[1, 2]}>`)
- **Materials**:
  - **Clay bodies**: `MeshStandardMaterial` with `roughness: 0.78`, `metalness: 0.05` for a matte tactile clay finish.
  - **White platforms**: `MeshStandardMaterial` with `roughness: 0.65`, `metalness: 0.02`.
  - **Electric blue accents & Data Cable**: `MeshStandardMaterial` with `emissive: "#1A5BFF"`, `emissiveIntensity: 0.45`, `roughness: 0.3`.
  - **Layer Stack plates**: `MeshPhysicalMaterial` with `transmission: 0.55`, `opacity: 0.85`, `transparent: true`, `roughness: 0.15`.
- **Lighting Rig**:
  - Soft warm-white `ambientLight` (`intensity: 0.75`)
  - Key `directionalLight` from top-front-left (`intensity: 1.1`, soft shadow map)
  - Cool lavender `hemisphereLight` (`skyColor: "#FFFFFF"`, `groundColor: "#D8DCF0"`, `intensity: 0.55`)

## 4. Continuous Vertical 3D World Layout

All stations are arranged vertically along the **Y-axis** and connected by a single curved **Data Cable** (`CatmullRomCurve3` + `TubeGeometry`):

1. **Smartphone (`y = +12`)**: Tilted slightly (`rotation: [0.08, -0.18, 0]`), search bar at top, link icon + blue tap pill, 3D hand/ripple trigger, and final Google page render.
2. **DNS Platform (`y = +5`)**: Floating rounded white slab with the electric-blue 3D Map Pin and two horizontal pill bars (`google.com` → `142.250.x.x`).
3. **TCP + TLS Gate (`y = 0`)**: Floating security ring / 3D padlock along the Data Cable representing the 3-way handshake and TLS tunnel.
4. **Network Layers & ISP (`y = -6`)**: Four stacked translucent glass/clay plates (`Application`, `Transport`, `Network`, `Link`) flanked by minimal clay ISP router nodes as Packets travel down the cable.
5. **Server Rack (`y = -13`)**: Three-tier stacked clay server units on a rounded white base with glowing blue LED dots and vent slots.

## 5. Persian HUD & Shorts Safe Zones

- **Typography**: `Vazirmatn` (Persian RTL, `dir="rtl"`) paired with `JetBrains Mono` for technical tokens (`DNS`, `TCP/TLS`, `200 OK`, IP addresses).
- **Card Style**: Soft-UI white cards (`rgba(255, 255, 255, 0.88)`, `backdrop-filter: blur(12px)`, `border-radius: 24px`, subtle `#1A5BFF` border/shadow).
- **YouTube Shorts Safe Zone**:
  - **Top margin**: `180px` clear
  - **Bottom margin**: `380px` clear (for Shorts title/caption/channel bar)
  - **Right margin**: `150px` clear (for Like/Comment/Share icons)
  - **Left margin**: `60px` clear
