# Productization Execution Order

## Goal

Track what has already been completed and what should happen next as the Bomberman prototype moves toward a more polished, shareable browser game.

This document is the working execution order. Use the broader [Productization V3 Roadmap](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/productization-v3-roadmap.md) for product direction, and use this file to decide the next implementation slice.

## Completed Plans

### 1. PowerUp V2

Status: completed

Delivered:

- classic power-ups: `bomb_up`, `flame_up`, `speed_up`
- probability-based drops from destroyed breakable walls
- server-authoritative pickup and stat updates
- HUD display for bomb capacity, flame range, and movement speed
- round reset clears power-ups and restores base stats

Reference:

- [PowerUp V2 Index](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/powerup-v2-index.md)

### 2. Room And Match Structure V3

Status: completed for current demo scope

Delivered:

- room-scoped server state
- Socket.IO room-scoped broadcasts
- direct room-code join flow
- quick match room assignment
- room cleanup when empty
- room registry tests
- invite-link URL flow
- visible copy-link action
- stricter room capacity behavior for full rooms

Reference:

- [Room And Match Structure V3](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/room-and-match-structure-v3.md)

### 3. Spectator, Ready, And Round UX V3

Status: completed for current demo scope

Delivered:

- explicit player `ready` state
- ready/unready UI button
- match starts only when enough players are ready
- ready counts in match state
- countdown overlay
- KO spectator overlay
- round result overlay
- camera fallback to a living player after local KO

Reference:

- [Spectator, Ready, And Round UX V3](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/spectator-ready-and-round-ux-v3.md)

### 4. Productization Follow-Up Bundle

Status: completed for current demo scope

Delivered:

- room invite links with `?room=` support
- copy invite link action
- quick-match URL sync after server assignment
- match feel effects: bomb pulse, flame pop, camera flash/shake, KO burst
- generated Phaser texture manifest for player, bomb, flame, and power-up visuals
- 4 room-selected arenas: `classic-yard`, `tight-corners`, `crossfire`, `islands`
- local profile nickname persistence
- local stats for rounds, wins, losses, draws, self-KOs, and bombs placed
- server-side bot filler for solo playtests
- demo guardrails: room capacity errors, event cooldowns, active match health metrics

## Completed Implementation Order

### 1. Room Invite Links And Quick-Match Polish

Why first:

- it completes the "send a link and play in 30 seconds" promise
- it improves demo usability before deeper game systems are added
- it is low risk because room state already exists

Scope:

- support `/room/:roomId` or query-based room prefill
- add copy invite link button
- show the assigned quick-match room clearly after `world:init`
- prevent obvious room confusion after refresh
- document local and deployed invite behavior

Acceptance criteria:

- opening an invite link pre-fills or auto-selects the target room
- copying a link uses the current room id
- quick match still resolves on the server
- tests/build pass

### 2. Match Feel Effects

Why second:

- the core rules already work, but the moment-to-moment feel is still prototype-like
- this makes the game more understandable and satisfying without changing authoritative logic

Scope:

- bomb fuse pulse
- explosion screen shake or camera flash
- pickup pop effect
- KO feedback
- chain reaction emphasis
- improved round-start and round-end motion

Acceptance criteria:

- visual effects are client-only and driven by server state
- effects do not leave stale objects after round reset
- reduced-motion users are not overwhelmed by non-essential animation
- tests/build pass

### 3. Asset And Graphics Upgrade Pass

Why third:

- asset work is most valuable once room flow, ready flow, and round state are stable
- doing it too early risks reworking sprites and UI around changing gameplay
- doing it before arena variety lets the first art direction become the basis for all maps

Scope:

- define a small visual target first: top-down cute arcade, toy-board, pixel-art, or clean vector arcade
- replace primitive players, bombs, flames, blocks, and power-ups with a first sprite set
- introduce an asset manifest so Phaser references stable keys instead of raw filenames
- keep DOM HUD styled consistently with the in-game art direction
- add lightweight sprite animation only where it improves readability

Acceptance criteria:

- all gameplay entities remain readable at current tile size
- sprite anchors and tile alignment are consistent
- fallback primitive rendering is not required for normal gameplay
- bundle size remains reasonable for Vercel demo use
- tests/build pass

### 4. Arena Variety

Why fourth:

- once the visual language is chosen, multiple arenas can share the same asset palette
- replayability improves more from a few tuned fixed maps than from more power-ups right now

Scope:

- add 3 fixed arena layouts
- add arena metadata: id, name, theme, grid
- select arena per room before round start
- optionally start with random arena if voting is too much for the first slice

Acceptance criteria:

- each room owns its selected arena
- all arenas preserve valid spawn positions
- destructible wall density differs meaningfully between arenas
- tests/build pass

### 5. Local Profile And Match Stats

Why fifth:

- stats become more meaningful after rounds, rooms, and arenas feel stable
- local persistence is useful without introducing account complexity

Scope:

- persist nickname locally
- track local wins, KOs, self-KOs, bombs placed, walls destroyed
- show end-of-round stat cards
- avoid permanent gameplay advantages

Acceptance criteria:

- stats survive refresh in the same browser
- stats do not affect authoritative gameplay
- UI remains compact during active play
- tests/build pass

### 6. Bot Filler For Solo Playtests

Why sixth:

- useful for demos and QA
- easier to tune after arena layouts exist

Scope:

- server-side or simulation-side simple bot players
- basic movement and bomb placement heuristics
- allow one human to test round flow alone

Acceptance criteria:

- bots use the same authoritative rules as players
- bots can be disabled for normal friend rooms
- tests/build pass

### 7. Production Guardrails

Why seventh:

- public sharing becomes safer after the gameplay loop is worth sharing
- current demo-scale deployment does not need full enterprise infrastructure yet

Scope:

- room capacity enforcement
- join/input/bomb rate limits
- reconnect grace period
- stale socket cleanup
- health/debug metrics: rooms, players, active matches, server version

Acceptance criteria:

- abusive input does not overload the room loop
- reconnect behavior is predictable
- Render/Vercel deployment remains simple
- tests/build pass

## Next Candidate Plans

### 1. Waiting Room And Rematch Polish

Scope:

- show player slots with ready and bot labels
- add clearer "ready for next round" prompt after round end
- expose room capacity in the lobby panel

### 2. Real Asset Pipeline

Scope:

- replace generated textures with sprite sheets or licensed asset packs
- add a manifest-driven preload stage
- add 4-direction player idle/walk animation

### 3. Reconnect Grace

Scope:

- keep a disconnected player slot for a short grace period
- allow refresh or reconnect to reclaim the same player within one room
- clean up stale slots after timeout

### 4. Map Voting

Scope:

- show current arena and alternatives before ready
- allow players to vote while match is waiting
- lock selected arena when countdown starts

## Asset And UI/UX Upgrade Strategy

### When To Apply Assets

Recommended timing: after `Room Invite Links And Quick-Match Polish`, before `Arena Variety`.

Reason:

- the player-facing flow will be stable enough to evaluate art in real play
- the round feedback surfaces already exist, so art can support real states instead of placeholders
- arenas should be built after the base visual language is chosen

Avoid doing a full asset pass before invite/quick-match polish. If onboarding is still clumsy, better sprites will not fix the first-session experience.

### How To Apply Assets

Use a staged asset pipeline:

1. Visual target
   Decide the style in one page before generating or buying assets.

2. Entity inventory
   List required assets: player idle/walk, bomb, flame, solid block, breakable block, three power-ups, KO marker, UI badges.

3. Asset manifest
   Add stable keys such as `player.default.walk.down`, `bomb.default`, `tile.breakable.wood`.

4. Phaser integration
   Replace primitives with sprites behind small rendering helpers, not scattered direct texture names.

5. UI alignment
   Update DOM HUD colors, typography, overlays, buttons, and panels to match the in-game art direction.

6. Playtest pass
   Verify readability first, beauty second.

### Suggested First Art Direction

Start with a "toy-board arcade" look:

- chunky rounded tiles
- bright but limited color palette
- soft shadows under characters and bombs
- readable silhouettes for bombs, flames, and power-ups
- playful DOM HUD with compact badges instead of dashboard cards

This fits the current tile-based Bomberman loop and avoids needing a large animation budget.

### Asset Sources

Good options:

- generate placeholder sprite sheets first, then replace later
- use open-license asset packs if the license is clear
- commission or manually draw a small coherent set after the gameplay style is proven

Avoid mixing multiple asset packs too early. Inconsistent art direction can make the game look worse than clean primitives.

### First Asset Slice

Do not replace everything at once.

Recommended first slice:

- player sprite with 4-direction idle/walk
- bomb sprite with fuse animation
- flame sprite or tile effect
- solid and breakable tile sprites
- power-up icons

Keep sound, skins, hats, and advanced VFX for later slices.
