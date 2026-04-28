# PR 1 - Shared Model And Match Skeleton

## Goal

Replace the free-movement demo model with Bomberman-ready shared types and introduce a server-side match skeleton without bombs yet.

## Scope

Included:

- shared game constants and state types
- grid map generation model
- server-side match state container
- server match lifecycle skeleton
- player join/spawn flow for a grid-based match

Excluded:

- bomb placement
- explosions
- deaths
- HUD changes
- final client scene migration

## Target Files

Must change:

- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)
- [src/shared/map.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/map.ts)
- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)

Recommended new files:

- `src/server/game/state.ts`
- `src/server/game/match.ts`

## Detailed Tasks

### 1. Redefine shared constants

- Change the world model from open coordinate movement to a Bomberman grid.
- Add constants for:
  - map width `13`
  - map height `11`
  - tile size
  - bomb fuse time
  - flame duration
  - round restart delay
- Define 4 fixed spawn tiles.

### 2. Add shared tile and match models

- Introduce `TileType` with at least:
  - `empty`
  - `solid`
  - `breakable`
- Introduce `MatchStatus`:
  - `waiting`
  - `starting`
  - `running`
  - `finished`
- Redefine `PlayerState` to include:
  - `tileX`, `tileY`
  - `pixelX`, `pixelY`
  - `alive`
  - `maxBombs`
  - `activeBombs`
  - `flameRange`
  - `moveSpeed`

### 3. Introduce future-facing shared state types

- Add `BombState`, `FlameState`, and `MatchState`.
- Even if PR 1 does not use all fields yet, define stable shapes now so later PRs build on them instead of rewriting them.

### 4. Redefine socket event contracts

- Replace free-position `player:move` semantics with a grid-game-friendly protocol direction.
- PR 1 should introduce the new event shapes, even if some are only partially used.
- Add events for:
  - initial match snapshot
  - player updates
  - match state updates

### 5. Replace the old blocked-set map with a tile grid generator

- Build a deterministic grid generator in `src/shared/map.ts`.
- Place outer walls and interior indestructible pillars.
- Fill remaining spaces with breakable walls while preserving spawn-safe areas.
- Add helpers for:
  - reading tile type
  - checking whether a tile is walkable
  - generating a fresh round grid

### 6. Introduce server match container

- Replace the current flat player map with a structured game state:
  - `players`
  - `grid`
  - `bombs`
  - `flames`
  - `match`
- Start with bombs/flames empty but present.
- Track the current round number and winner placeholder.

### 7. Add server match lifecycle skeleton

- On player join:
  - assign a spawn
  - create a Bomberman-ready player state
  - add the player to the match
- Add match status transitions:
  - `waiting` by default
  - move to `starting` when minimum players reached
  - after a short countdown, move to `running`
- It is acceptable in PR 1 to keep the countdown simple and timer-based.

## Decisions Locked In

- Minimum start players: `2`
- Spawn count supported in v1: `4`
- Match restart behavior can remain stubbed until PR 5
- Grid generation should be deterministic for now, not seeded random yet

## Validation

- `npm run build`
- Confirm shared types compile cleanly
- Confirm the server can start with the new state model
- Confirm two connected clients receive the same map and match state shape

## Risks

- Overdefining protocol shapes too early can create churn later
- Underspecifying them now will create repeated rewrites in PR 2 and PR 3

## Done When

- The server owns a Bomberman-ready match state
- The shared layer exposes a stable grid/game model
- The project no longer depends on the old free-roaming map assumptions at the type level

