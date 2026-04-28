# Deployment Sub-Harness

Use this file for Render, Vercel, CI/CD, environment variables, deployment validation, and rollout decisions.

## Skills To Activate

- `solid`
- `deployment-pipeline-design`
- `documentation-writer` when the task includes operator-facing docs

## Platform Rules

### Render

- Keep the socket server compatible with Render web service deployment.
- Respect `PORT`.
- Respect `CLIENT_ORIGIN`.
- Assume free-tier spin-down and limited CPU are real constraints.
- Do not introduce assumptions that require persistent disks or background workers unless explicitly requested.

### Vercel

- Keep the client compatible with static Vite deployment on Vercel.
- Keep `VITE_SERVER_URL` as the browser-facing server endpoint pattern.
- Do not move server responsibilities into Vercel Functions for long-lived Socket.IO connections.

## Workflow Rules

- Prefer low-friction deployment setup for this demo.
- Document any env var changes.
- Validate the cheapest meaningful production-facing path:
  - build
  - health check
  - env compatibility

## Avoid

- Overbuilding CI/CD for a simple demo
- Introducing infra assumptions not supported by the chosen hosts
- Hiding required env vars or deploy steps

