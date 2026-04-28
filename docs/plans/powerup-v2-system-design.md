# PowerUp V2 - System Design

## Goal

Add collectible round-scoped power-ups that deepen gameplay while preserving the current single-room Bomberman architecture.

## Power-Up Types

The first release includes exactly three power-up types:

- `bomb_up`
  - increases `maxBombs` by `+1`
- `flame_up`
  - increases `flameRange` by `+1`
- `speed_up`
  - increases `moveSpeed` by a fixed per-pickup increment

These effects stack during a round and are reset when the next round starts.

## State Model

Add the following shared types:

- `PowerUpType = "bomb_up" | "flame_up" | "speed_up"`
- `PowerUpState = { id: string; type: PowerUpType; tileX: number; tileY: number; spawnedAt: number }`

Add `powerUps: PowerUpState[]` to:

- `WorldInitPayload`
- `WorldUpdatedPayload`

Add `powerUps: Map<string, PowerUpState>` to server game state.

## Drop Rules

- power-ups can only appear when a `breakable` wall is destroyed
- `solid` walls and already empty tiles never generate drops
- each destroyed `breakable` wall runs exactly one drop roll
- the result is either:
  - no drop
  - one `bomb_up`
  - one `flame_up`
  - one `speed_up`
- the chosen result becomes a `PowerUpState` placed on the destroyed tile

The drop roll must be deterministic from the server perspective and must never be decided by the client.

## Pickup Rules

- a pickup is collected when a living player occupies the same tile as the power-up
- pickup resolution happens on the server after movement resolution
- once collected, the power-up is removed from `powerUps`
- the same item cannot be collected twice
- dead players cannot collect items

## Stat Application Rules

- `bomb_up` updates `player.maxBombs += 1`
- `flame_up` updates `player.flameRange += 1`
- `speed_up` updates `player.moveSpeed += SPEED_UP_INCREMENT`

The effect applies immediately and affects subsequent gameplay in the same round:

- higher `maxBombs` changes bomb capacity checks
- higher `flameRange` changes future bomb explosions
- higher `moveSpeed` changes movement stepping

## Round Reset Rules

At round restart:

- all spawned power-ups are removed
- all player power-up effects are reset
- `maxBombs`, `flameRange`, and `moveSpeed` return to defaults
- no power-up state is carried across rounds

This phase does not persist progression across matches or reconnects.

## Server Responsibilities

- run drop rolls when `breakable` walls are destroyed
- create and store spawned `PowerUpState`
- detect player-item overlap after movement
- apply the stat effect
- remove collected items
- include `powerUps` in world snapshots
- clear `powerUps` during round reset

## Client Responsibilities

- render spawned power-ups in the Phaser scene
- remove them when `world:updated` no longer includes them
- reflect changed player stats through existing `player:updated` and world snapshot data
- show bomb cap, flame range, and speed in the HUD

## Event Model

This phase does not introduce a new dedicated power-up socket event.

Use:

- `world:init` for initial power-up state
- `world:updated` for ongoing power-up additions and removals
- `player:updated` for player stat changes that need to appear immediately

## Risks

- if drop generation and destruction are handled in separate places, item spawning can drift from wall state
- if speed increases are too large, movement and reconciliation will feel unstable
- if player stat updates are not emitted after pickup, the HUD and scene can drift until the next snapshot
