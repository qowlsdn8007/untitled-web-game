# Online Bomberman Plan Index

This directory contains the implementation plans for converting the current multiplayer movement demo into an online Bomberman-style game.

Recommended execution order:

1. [PR 1 - Shared Model And Match Skeleton](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/pr-1-shared-model-and-match-skeleton.md)
2. [PR 2 - Grid Movement And Scene Conversion](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/pr-2-grid-movement-and-scene-conversion.md)
3. [PR 3 - Bomb Placement](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/pr-3-bomb-placement.md)
4. [PR 4 - Explosion And Destruction](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/pr-4-explosion-and-destruction.md)
5. [PR 5 - Round Flow And HUD](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/plans/pr-5-round-flow-and-hud.md)

Cross-cutting rules:

- Keep the server authoritative for movement, bombs, flame resolution, deaths, and round flow.
- Keep protocol types centralized under `src/shared`.
- Keep Phaser rendering concerns separate from server game-state decisions.
- Use the harness files in `AGENTS.md` and `docs/harness/` as behavioral guidance while implementing these plans.

