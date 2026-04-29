# Project Harness

This repository uses an explicit harness built around installed skills.

The purpose of this file is not to restate every stack best practice. It is to:

- define project-wide behavior
- route tasks to the right installed skills
- resolve conflicts between local patterns and skill guidance
- point to focused sub-harness files by work type

## Project Context

This project is a browser-based multiplayer 2D map application built with:

- React + Vite
- TypeScript
- Phaser
- Socket.IO
- Node.js + Express
- Render for the socket server
- Vercel for the client

The project is currently demo-scale. Prefer solutions that are simple, maintainable, and scalable enough for the current size without prematurely introducing enterprise architecture.

## Installed Skills

### Global skills

- `prompt-engineering-patterns`
- `vercel-react-best-practices`
- `typescript-advanced-types`
- `deployment-pipeline-design`
- `documentation-writer`
- `feature-sliced-design`
- `find-skills`

### Project-local skills

- `solid`
- `tdd`
- `websocket-engineer`
- `clean-ddd-hexagonal`
- `feature-sliced-design`
- `conventional-commits-next`

## Core Behavior

- Inspect the code before deciding.
- Prefer the smallest correct change.
- Preserve local conventions unless the task is a deliberate refactor.
- Validate with the cheapest meaningful check.
- Keep explanations concise and implementation-oriented.
- Prefer maintainability and clarity over abstraction for its own sake.

## Skill Orchestration

Installed skills are part of the default workflow and should be used when relevant.

### Always-on quality layer

- `solid`
- `tdd`

Apply `solid` and `tdd` to coding work as the default quality baseline.

Interpret it with project-scale judgment:

- prefer clean code, focused units, low coupling, and good naming
- prefer testability and maintainability
- prefer red-green-refactor with small vertical slices when practical
- write behavior-focused tests through public interfaces when adding or changing core logic
- if no test harness exists yet, introduce the lightest useful test coverage for the changed behavior rather than skipping tests by default
- do not force heavyweight abstractions, object wrapping, or full TDD ceremony when that would clearly overcomplicate this demo-scale codebase
- use its principles as a quality filter, not as permission to over-engineer

### Task routing

- Prompt, harness, and reusable instruction design:
  `prompt-engineering-patterns`

- React components, rendering behavior, state flow, frontend refactors:
  `vercel-react-best-practices`
  See [frontend.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/frontend.md)

- TypeScript strictness, type modeling, shared payload contracts:
  `typescript-advanced-types`
  See [frontend.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/frontend.md)

- Socket.IO, real-time messaging, connection handling, rooms, reconciliation, latency-sensitive changes:
  `websocket-engineer`
  See [multiplayer.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/multiplayer.md)

- Frontend structure, slice boundaries, placement decisions, import rules:
  `feature-sliced-design`
  See [architecture.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/architecture.md)

- Backend/domain architecture when the server side grows beyond simple handlers:
  `clean-ddd-hexagonal`
  See [architecture.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/architecture.md)

- Deployment, CI/CD, release safety, environment topology:
  `deployment-pipeline-design`
  See [deployment.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/deployment.md)

- README, guides, technical documentation:
  `documentation-writer`
  See [documentation.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/documentation.md)

- Commit messages, squash commit text, release bump reasoning, and commit history cleanup:
  `conventional-commits-next`
  See [version-control.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/version-control.md)

- Skill discovery for new domains:
  `find-skills`

## Conflict Resolution

Use this priority order when guidance conflicts:

1. Explicit user request
2. Existing repository patterns
3. This file and the sub-harness files
4. The most relevant installed skill
5. General best practices

Examples:

- If `solid` suggests more abstraction but the project is still demo-scale, preserve simplicity.
- If `feature-sliced-design` would move code across layers for a tiny local change, keep it local unless restructuring is the task.
- If `clean-ddd-hexagonal` suggests richer backend boundaries but the current server is still a simple Socket.IO service, do not force DDD structures.

## Sub-Harness Selection

Use the minimum relevant sub-harness files for a task.

- UI or React changes:
  [frontend.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/frontend.md)

- Socket or movement synchronization changes:
  [multiplayer.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/multiplayer.md)

- File structure or architectural reshaping:
  [architecture.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/architecture.md)

- Render/Vercel/env/deploy changes:
  [deployment.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/deployment.md)

- README or guide writing:
  [documentation.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/documentation.md)

- Commit messages or release bump reasoning:
  [version-control.md](/Users/bjw/Documents/Codex/2026-04-27-new-chat/docs/harness/version-control.md)

## Project Defaults

- Keep React shell state separate from Phaser runtime state.
- Keep client/server protocol types shared and centralized.
- Prioritize local player responsiveness over aggressive self-correction.
- Keep Render and Vercel compatibility intact.
- Use `conventional-commits-next` for commits.

## Anti-Patterns

- Forcing enterprise architecture onto small demo-scale changes
- Duplicating protocol types across files
- Snapping the local player to every echoed server update
- Mixing React state and Phaser scene state without clear boundaries
- Introducing deployment assumptions that break Render free-tier behavior
