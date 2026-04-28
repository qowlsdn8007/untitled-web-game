# PR 2 - Grid Movement And Scene Conversion

## Goal

Convert movement from client-computed free-position updates into server-authoritative grid movement, and update the Phaser scene to render a Bomberman-style map.

## Scope

Included:

- server-driven movement
- client input event changes
- tile-based movement rules
- Bomberman-style map rendering
- local/remote player rendering updates

Excluded:

- bombs
- explosions
- deaths
- match result UI

## Target Files

Must change:

- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)
- [src/client/game/MultiplayerScene.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/MultiplayerScene.ts)
- [src/client/game/map.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/map.ts)
- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)

Recommended new files:

- `src/server/game/movement.ts`
- `src/client/game/interpolation.ts`

## Detailed Tasks

### 1. Replace position-push networking

- Stop sending raw client-computed `{ x, y }` movement events.
- Introduce direction/input-based events from client to server.
- Recommended payload:
  - `direction`
  - `moving`
  - optional sequence number if useful

### 2. Move movement resolution to the server

- The server should decide whether a player can move into the next tile.
- Movement should obey:
  - map bounds
  - solid walls
  - breakable walls
- No diagonal movement.

### 3. Use tile-centered movement

- Internally, progress is tile-based.
- Rendering remains smooth by moving from tile center to tile center over time.
- `tileX/tileY` are the source of truth.
- `pixelX/pixelY` are presentation state derived by motion.

### 4. Update the scene input model

- Replace the current free-vector movement loop with a direction input sender.
- Preserve focus-loss input reset behavior added previously.
- Only the local player sends input.
- Remote players remain display-only.

### 5. Render the Bomberman grid

- Replace the current map visuals with:
  - clearly distinct solid wall tiles
  - breakable wall tiles
  - empty floor tiles
- Keep the first version code-drawn rather than asset-driven.

### 6. Rework player rendering

- Players should visually snap to grid lanes while still moving smoothly.
- The local player should not jitter from echoed server updates.
- Keep local responsiveness as high as possible without reintroducing old free-movement logic.

## Decisions Locked In

- The server is authoritative for movement
- The client is allowed only lightweight prediction / smoothing
- Movement is 4-directional
- Tile entry is blocked by non-empty collidable tiles

## Validation

- `npm run build`
- Two clients can connect and move on the new grid
- Players cannot walk through solid or breakable walls
- Local movement feels stable against the remote Render-hosted server

## Risks

- Mixing old pixel rules and new tile rules can cause desync
- Self-reconciliation regressions may reintroduce jitter

## Done When

- The game looks and moves like a grid-based arena
- The server, not the client, decides legal movement

