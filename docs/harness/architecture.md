# Architecture Sub-Harness

Use this file when changing project structure, ownership boundaries, or backend design direction.

## Skills To Activate

- `solid`
- `tdd`
- `feature-sliced-design`

Activate `clean-ddd-hexagonal` only when backend/domain complexity clearly justifies it.

## Frontend Structure Rules

- Follow Feature-Sliced Design pragmatically.
- Start simple and extract only when repetition or coupling makes it worthwhile.
- Do not create empty layers preemptively.
- Prefer local page ownership for page-local logic.
- Respect import direction and boundary clarity when the project actually uses FSD structure.

## Backend Structure Rules

- The current server is simple and demo-scale.
- Default to straightforward service/module organization.
- Use `clean-ddd-hexagonal` only when you see:
  - meaningful business rules
  - growing domain concepts
  - multiple entry points
  - repositories or ports/adapters becoming useful

## Architectural Priority

- Simplicity first
- Clear boundaries second
- Reuse third
- Generalized architecture only when earned

## Avoid

- Restructuring without a concrete pain point
- Applying DDD vocabulary without domain complexity
- Extracting FSD layers “just in case”
- Letting architecture work dominate feature delivery
