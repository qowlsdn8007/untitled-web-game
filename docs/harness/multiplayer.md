# Multiplayer Sub-Harness

Use this file for Socket.IO, real-time synchronization, movement, latency, connection handling, and multiplayer architecture changes.

## Skills To Activate

- `solid`
- `websocket-engineer`
- `typescript-advanced-types`

Use `clean-ddd-hexagonal` only if multiplayer server responsibilities grow into a richer backend domain.

## Working Rules

- Prioritize responsive local movement.
- Treat local prediction and remote synchronization as separate concerns.
- Be cautious when applying echoed server updates to the local player.
- Preserve shared event contracts in centralized protocol types.
- Prefer incremental multiplayer improvements over full networking rewrites.

## Connection and State Rules

- Consider blur, visibility change, reconnect, disconnect, and focus-loss edge cases.
- Preserve deterministic server behavior.
- Validate and sanitize inbound payloads.
- Avoid broad `io.emit` growth without considering room or scope boundaries.
- When changing synchronization logic, think about RTT, jitter, burst traffic, and reconnection recovery.

## Scaling Judgment

- This project is demo-scale by default.
- Do not introduce Redis, clustering, DDD layers, or full MMO-style systems unless explicitly requested.
- Still preserve a path toward:
  - room partitioning
  - better reconciliation
  - stronger server authority
  - improved observability

## Avoid

- Snapping local player position on every server echo
- Duplicating socket payload types
- Mixing transport concerns with scene rendering code
- Introducing complexity that does not improve actual multiplayer behavior

