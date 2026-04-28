# PR 5 - Round Flow And HUD

## Goal

Complete the gameplay loop with death handling, winner/draw resolution, round restart logic, and a usable HUD.

## Scope

Included:

- death handling
- alive/dead state transitions
- winner/draw resolution
- automatic round reset
- HUD updates in the React shell

## Target Files

Must change:

- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)
- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)
- [src/client/App.tsx](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/App.tsx)
- [src/client/styles/global.css](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/styles/global.css)
- [src/client/game/MultiplayerScene.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/MultiplayerScene.ts)

## Detailed Tasks

### 1. Add death resolution

- If a player's tile is inside flame coverage while flames are active, mark the player dead.
- Dead players should:
  - stop accepting movement input
  - stop accepting bomb placement
  - render as defeated in the scene

### 2. Resolve end-of-round conditions

- If exactly one player remains alive, declare them the winner.
- If no players remain alive, declare a draw.
- Move the match to `finished`.

### 3. Reset the round

- After the configured delay:
  - rebuild the grid
  - clear bombs
  - clear flames
  - respawn players
  - reset bomb counts and ranges
  - increment round counter
  - move back to `starting` or `running` depending on design

### 4. Add match state presentation

- Show:
  - current match state
  - round number
  - player alive/dead state
  - bomb capacity / active bombs if useful
  - winner or draw message during round end

### 5. Polish scene-state resets

- Ensure old flames, destroyed walls, and player visuals do not leak into the next round.

## Decisions Locked In

- Round restart delay: `3000ms`
- Draw is allowed
- Dead players remain in the scene visually but are inactive until reset

## Validation

- `npm run build`
- A player hit by flames dies
- Last surviving player wins
- Simultaneous death resolves to draw
- Round resets cleanly after finish
- HUD reflects state transitions correctly

## Risks

- Reset timing bugs can leave stale visuals or stale server state
- UI state and game-scene state may drift if not both driven from the same match status data

## Done When

- The game can start, run, end, and restart without manual intervention
- Players can understand the current round state from the HUD alone

