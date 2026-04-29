# Productization V3 Roadmap

## Goal

Turn the current online Bomberman prototype into a more product-ready browser game while preserving the small, fast Phaser + React + Socket.IO stack.

This roadmap is intentionally player-facing first. Technical hardening matters, but the next product gains should come from making the game easier to enter, easier to replay, and more fun to share.

## Product Direction

The strongest direction is a casual competitive party game:

- short sessions of 2-4 players
- instant browser join through room links or quick match
- readable 2D arena combat
- satisfying bombs, chain reactions, power-ups, and round results
- lightweight progression through cosmetics and stats, not pay-to-win power

The game should feel closer to "send a link and play in 30 seconds" than a heavy online service.

## Priority Pillars

### 1. First 30 Seconds

Objective: a new player should understand and start a match without reading documentation.

Recommended features:

- room link join flow: `/room/:roomId`
- quick match button with visible assigned room code
- short waiting-room state with player slots
- ready button instead of auto-start only
- compact control hints that disappear after the player moves and places a bomb
- bot filler for solo testing or empty rooms

Why first:

- it improves every playtest
- it reduces confusion before adding deeper systems
- it makes sharing the demo much easier

### 2. Match Feel

Objective: make each round feel intentional, reactive, and rewarding.

Recommended features:

- countdown overlay before round start
- round-end banner with winner, draw, and rematch timing
- screen shake and flash on bomb explosion
- clearer KO state and respawn transition
- chain reaction feedback when bombs trigger each other
- simple announcer text such as `Round 2`, `Final 30 seconds`, `Draw`

Why second:

- the rules already exist, but they need emotional feedback
- this is high value without changing backend architecture heavily

### 3. Arena Variety

Objective: give players a reason to play multiple rounds.

Recommended features:

- 3-5 fixed arena layouts
- arena vote before match start
- destructible wall density presets
- spawn protection for the first second
- optional sudden-death shrink or extra flames near timeout

Initial arena themes:

- `classic-yard`: current balanced starter map
- `tight-corners`: higher wall density and close fights
- `crossfire`: open center with dangerous lanes
- `islands`: separated pockets that open over time

Why third:

- replayability grows faster from arena variation than from many new items
- fixed layouts are easier to balance than procedural generation

### 4. Progression Without Power Creep

Objective: make returning feel rewarding without damaging competitive fairness.

Recommended features:

- local profile name persistence
- match stats: wins, KOs, self-KOs, bombs placed, walls destroyed
- cosmetic colors, simple hats, trails, or name badges
- end-of-round stat cards
- lightweight achievements such as `First KO`, `Chain Reaction`, `Wall Breaker`

Avoid for now:

- permanent gameplay stat upgrades
- paid power advantages
- complex account systems before the loop is sticky

Why fourth:

- it creates retention hooks
- it stays safe for a casual competitive game

### 5. Social And Spectator

Objective: make the game watchable and easy to play with friends.

Recommended features:

- copy invite link
- room owner controls: restart, kick disconnected ghost players
- spectator mode for full rooms or late joiners
- simple emoji/ping reactions after KO or round end
- shareable match result summary

Why fifth:

- social distribution is the most realistic growth path for a small browser game
- spectator mode also helps debugging and demos

## Production Readiness Tracks

### Runtime Reliability

- explicit room lifecycle states: waiting, starting, running, finished
- server-side room capacity enforcement
- reconnect handling with grace period
- stale socket cleanup
- ping/latency indicator
- server tick metrics

### Networking

- keep server authoritative simulation
- keep client-side prediction limited to local movement feel
- send compact action/input events from client
- broadcast snapshots or deltas at predictable cadence
- prepare Redis adapter only when scaling beyond a single server instance

### Safety And Abuse

- nickname sanitization and reserved length limits
- rate limits for join, input, bomb placement, and room creation
- basic profanity filter only if public sharing begins
- moderation hooks before anonymous public matchmaking

### Observability

- room count, player count, and active match count
- disconnect rate
- average round length
- quick-match wait time
- client build version and server version in health/debug output

## Suggested Implementation Order

1. Complete `Room And Match Structure V3`.
2. Add `Ready / Spectator / Round UX V3`.
3. Add room invite links and quick-match polish.
4. Add match feel effects: countdown, result banner, explosion feedback.
5. Add 3 fixed arenas and map voting.
6. Add local profile persistence and stats.
7. Add bot filler for solo playtests.
8. Add basic production guardrails: rate limits, metrics, reconnect grace.

## MVP Product Definition

A stronger demo-quality product should support:

- create or quick-join a room
- invite a friend with a link
- ready up and play 2-4 player rounds
- see clear round start/end feedback
- play at least 3 arena layouts
- collect the 3 classic power-ups
- view basic match stats
- recover cleanly from refresh or disconnect

## Explicit Non-Goals For This Phase

- ranked matchmaking
- global accounts
- real-money monetization
- large public lobbies
- user-generated maps
- mobile touch controls beyond basic responsive layout
- multi-region authoritative server architecture

## Open Design Questions

- Should the game target exactly 4 players per room, or allow 2-8 with different arena sizes?
- Should rounds have a hard timer and sudden death, or remain elimination-only?
- Should spectators be allowed to join any room by link, or only after a room is full?
- Should cosmetics be local-only at first, or should they require persistence?
- Should quick match prefer waiting rooms only, or allow joining matches in progress as spectator?

## Success Criteria

- a first-time player can join and understand the objective within 30 seconds
- two players can create a room, invite, ready, play, and rematch without developer help
- a round result feels clear without reading logs or HUD details
- replaying three rounds feels meaningfully varied
- core server behavior remains authoritative and testable
