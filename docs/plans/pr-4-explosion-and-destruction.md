# PR 4 - Explosion And Destruction

## Goal

Add bomb detonation, flame propagation, chain reactions, and breakable-wall destruction.

## Scope

Included:

- timed detonation
- flame generation
- solid wall blocking
- breakable wall destruction
- chain reactions
- bomb cleanup

Excluded:

- round win/loss flow
- HUD messaging

## Target Files

Must change:

- [src/server/index.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/server/index.ts)
- [src/shared/protocol.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/protocol.ts)
- [src/client/game/MultiplayerScene.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/client/game/MultiplayerScene.ts)
- [src/shared/map.ts](/Users/bjw/Documents/Codex/2026-04-27-new-chat/src/shared/map.ts)

Recommended new files:

- `src/server/game/explosions.ts`

## Detailed Tasks

### 1. Detonate expired bombs

- In the server tick/update loop, detect bombs whose fuse has elapsed.
- Remove them from active bomb storage after detonation is resolved.
- Decrease owner `activeBombs`.

### 2. Compute flame propagation

- Flames should include:
  - the bomb tile itself
  - one tile in each cardinal direction per flame range
- Stop propagation at `solid`.
- Include the first `breakable` tile, destroy it, and stop continuing past it.

### 3. Add flame state

- Store short-lived flame tiles with expiry timestamps.
- Replicate them to clients so they can render the blast visually.

### 4. Add chain reactions

- If a flame reaches another bomb, that bomb should detonate immediately.
- Avoid duplicate-processing the same bomb in a single chain reaction.

### 5. Update tile state after destruction

- Breakable walls hit by flames become `empty`.
- All clients must receive the updated tile layout.

### 6. Render flame effects

- Add simple flame tile rendering in the Phaser scene.
- The first version may use bright rectangles or crosses rather than sprite assets.

## Decisions Locked In

- Flame duration: `500ms`
- Chain reactions: enabled in v1
- Breakable walls do not survive a hit

## Validation

- `npm run build`
- Bombs explode after the configured fuse
- Flame spread respects walls correctly
- Breakable walls are removed
- Chain reactions trigger correctly

## Risks

- Recursive chain handling can double-process bombs if not guarded
- Rendering stale flame state can leave ghost effects if cleanup timing is wrong

## Done When

- Bombs create believable Bomberman-style explosions
- Wall destruction and chain reactions work consistently across clients

