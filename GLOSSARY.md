# Motion Design Studio — `google.com` Journey

A 75-second vertical (9:16) 3D motion graphic built with Remotion and Three.js, explaining what happens when a mid-level software engineer opens `google.com`.

## Visual & Spatial Language

**Continuous World**:
The single vertical 3D coordinate space (inspired by `reference.png`) housing all stations from the smartphone at the top to the server rack at the bottom.
_Avoid_: Separate scenes, cutaway clips

**Station**:
One of the six narrative and spatial checkpoints along the journey: Browser & Cache, DNS Resolution, TCP + TLS Handshake, Network Layers & ISP Routing, Server & Response, and Browser Rendering.
_Avoid_: Slide, chapter, step

**Data Cable**:
The glowing blue 3D spline connecting the smartphone, DNS platform, ISP/network stack, and server rack.
_Avoid_: Line, wire, path

**Packet**:
A glowing 3D data pulse traveling along the Data Cable that visually gains or sheds header rings as it crosses the Layer Stack.
_Avoid_: Ball, dot, particle

**Layer Stack**:
Four stacked translucent 3D plates representing the network layers (`Application`, `Transport`, `Network`, `Link`) between the ISP/DNS stage and the server.
_Avoid_: OSI box, protocol table

**Persian HUD**:
The HTML/CSS `<AbsoluteFill>` overlay rendered above the Three.js canvas for crisp RTL Persian titles, callouts, and technical badges.
_Avoid_: 3D text, WebGL labels
