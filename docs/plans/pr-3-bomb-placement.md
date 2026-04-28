# PR 3 - Bomb Placement

## Goal

Add bomb placement as a server-authoritative action, including placement rules, bomb state replication, and basic bomb rendering.

## Scope

Included:

- bomb placement input
- server validation
- active bomb count tracking
- bomb rendering on clients

Excluded:

- explosions
- flame tiles
- wall destruction
- death handling

## Target Files

Must change:

- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)
- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)
- [src/client/game/MultiplayerScene.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/MultiplayerScene.ts)

Recommended new files:

- `src/server/game/bombs.ts`
- `src/client/game/bombs.ts`

## Detailed Tasks

### 1. Add bomb placement event

- Add a dedicated `bomb:place` client event.
- Trigger it from a keyboard action, recommended: space bar.

### 2. Validate placement on the server

- Only allow placement while:
  - player is alive
  - match is running
  - player has free bomb capacity
  - current tile does not already contain a bomb

### 3. Create bomb state

- Store:
  - bomb id
  - owner id
  - tile position
  - placed timestamp
  - explode timestamp
  - flame range

### 4. Track ownership limits

- Increase `activeBombs` when placed.
- Do not yet decrease it until PR 4 explosion resolution.
- Ensure bomb capacity rules are visible to the client through synced player state.

### 5. Render bombs in the scene

- Add bomb visuals to the Phaser scene.
- Keep the first implementation simple:
  - circle or rounded rectangle
  - optional pulse animation later

### 6. Prepare occupancy logic

- The tile with a bomb should become non-enterable for most movement checks.
- The full owner-pass-through rule can be completed in PR 4 if needed, but PR 3 should not break movement consistency.

## Decisions Locked In

- Starting bomb capacity: `1`
- Initial flame range: `1`
- Bomb fuse time already defined in shared constants

## Validation

- `npm run build`
- A player can place a bomb while the match is running
- A player cannot place more than the allowed number
- Bomb state is visible from another client

## Risks

- Movement logic may need a temporary bomb occupancy exception for the owner
- If bomb occupancy is left too permissive, later explosion logic becomes inconsistent

## Done When

- Bomb placement is a real multiplayer action visible to all connected players

