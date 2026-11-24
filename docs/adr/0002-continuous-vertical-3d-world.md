# 0002. Single Continuous Vertical 3D World

- **Status**: accepted

All six stations (Smartphone, DNS Platform, ISP/TLS, 4-Layer Stack, and Server Rack) live inside one continuous vertical 3D coordinate space connected by a single Data Cable, rather than six independent scenes with hard cuts.

## Considered Options

- **Six separate 3D scenes**: Easier to position objects per scene, but breaks the unified vertical composition of `reference.png` and loses the physical sense of a packet traveling from phone to server and back.

## Consequences

- Camera position and look-at targets are animated along a master vertical timeline (`75s` / `2250 frames` at `30fps`).
- Station Y-coordinates must be spaced carefully so adjacent stations do not clutter the 9:16 viewport during zoom-ins.
