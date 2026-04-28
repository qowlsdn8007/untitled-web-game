# PowerUp V2 Plan Index

This document set defines the next gameplay expansion after the Bomberman v1 loop.

Current state:

- v1 already supports grid movement, bomb placement, explosions, wall destruction, deaths, round resolution, and a HUD
- the server is authoritative for movement, bombs, flames, deaths, and match flow
- gameplay variety is still limited because all rounds begin with the same player capabilities

V2 goal:

- introduce collectible power-ups that increase strategic variety without changing the single-room architecture
- keep the implementation compatible with the current server-driven snapshot model
- preserve the current round loop while making progression meaningful inside each round

Recommended execution order:

1. [PowerUp V2 - System Design](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/powerup-v2-system-design.md)
2. [PowerUp V2 - Implementation Plan](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/powerup-v2-implementation-plan.md)
3. [PowerUp V2 - Balance Defaults](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/powerup-v2-balance-defaults.md)

Cross-cutting rules:

- keep the server authoritative for drop generation, pickup resolution, and stat updates
- keep `src/shared/protocol.ts` as the source of truth for public gameplay types
- keep the current single-room session model
- do not add advanced abilities such as bomb kick, remote bomb, or pass-through effects in this phase
- reset all power-up effects and spawned items at round restart
