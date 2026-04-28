# PowerUp V2 - Implementation Plan

## Goal

Implement the classic three power-ups on top of the current Bomberman v1 loop.

## Target Files

Must change:

- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)
- [src/server/game/state.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/game/state.ts)
- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)
- [src/client/game/MultiplayerScene.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/MultiplayerScene.ts)
- [src/client/App.tsx](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/App.tsx)

Recommended new files:

- `src/server/game/powerups.ts`
- `src/server/game/powerups.test.ts`

## Implementation Order

### 1. Extend shared state and balance constants

- add `PowerUpType` and `PowerUpState`
- add `powerUps` to `WorldInitPayload` and `WorldUpdatedPayload`
- add balance constants for:
  - drop chance
  - speed increment
  - optional stat caps

### 2. Add server power-up storage

- extend `GameState` with `powerUps: Map<string, PowerUpState>`
- include `powerUps` in world snapshots
- clear `powerUps` in round reset

### 3. Add drop generation

- when a `breakable` tile is destroyed in explosion resolution, run a server-side drop roll
- if the roll succeeds, create a power-up on that tile
- keep the drop logic in a dedicated helper so it can be tested independently

### 4. Add pickup resolution

- after movement resolution, check whether each living player stands on a power-up tile
- apply the correct stat increase
- remove the collected item from server state
- emit:
  - updated world snapshot data
  - updated player state for the affected player

### 5. Add Phaser rendering

- render each power-up as a simple marker on its tile
- use distinct colors or labels for the three types
- synchronize additions and removals through `world:init` and `world:updated`

### 6. Extend the HUD

- keep the current status panel structure
- add or update fields for:
  - bomb cap
  - current flame range
  - current speed

### 7. Validate round reset behavior

- verify that power-ups disappear after round restart
- verify that player stats return to default values
- verify that the next round starts without stale item visuals

## Test Cases

- destroying a `breakable` wall can spawn a power-up
- destroying a `solid` wall or empty tile never spawns a power-up
- a player on a power-up tile immediately collects it
- `bomb_up` increases bomb capacity
- `flame_up` increases future explosion range
- `speed_up` increases movement speed
- collected items are removed from world state
- all power-ups and boosted stats are reset at round restart
- `world:init` includes `powerUps`
- `world:updated` includes `powerUps`

## Done When

- the scene shows spawned power-ups consistently across clients
- collected power-ups change gameplay immediately
- the HUD reflects the boosted stats
- round resets clear both the power-up state and the visual markers
