# Frontend Sub-Harness

Use this file for React, Vite, TypeScript, and Phaser-adjacent UI work.

## Skills To Activate

- `solid`
- `vercel-react-best-practices`
- `typescript-advanced-types`

Use `feature-sliced-design` only if the task is structural.

## Working Rules

- Keep React UI concerns separate from Phaser scene/runtime concerns.
- Follow React hook rules and avoid conditional hook calls.
- Prefer clear component boundaries over broad shared abstractions.
- Preserve Vite-compatible behavior and client env rules.
- Keep TypeScript strict and avoid weakening types to silence errors.
- Reuse shared protocol types instead of redefining payloads locally.

## Defaults

- Keep new UI logic close to where it is used unless repeated enough to justify extraction.
- Prefer readable state flow over clever optimization.
- Treat bundle size and rerender behavior as important, but do not optimize speculatively.
- Use `VITE_` prefix for browser-exposed env vars only.

## Phaser Boundary Rules

- Phaser scene lifecycle belongs in scene modules, not generic React components.
- Browser input, focus, visibility, and cleanup logic must be explicit.
- React should mount and host the game cleanly, not own gameplay state.

## Avoid

- Hook misuse
- Shared state duplication between React and Phaser
- Duplicated network payload interfaces
- Heavy abstractions for one-off UI code

