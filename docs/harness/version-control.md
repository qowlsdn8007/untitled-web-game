# Version Control Sub-Harness

Use this file for commit messages, squash commit text, release bump reasoning, changelog inputs, and cleanup of commit history language.

## Skills To Activate

- `conventional-commits-next`

Use `documentation-writer` alongside this file when commit history text becomes release notes, changelog entries, or user-facing documentation.

## Working Rules

- Inspect the actual diff before choosing a commit type or scope.
- Prefer one commit per coherent change when practical.
- Use imperative present tense in commit descriptions.
- Keep commit titles concise and specific.
- Add bodies only when motivation, behavior, migration notes, or operational context would otherwise be unclear.
- Preserve repository-local commit style when it is more specific than the general convention.

## Conventional Commit Rules

- Use `feat` for new features.
- Use `fix` for bug fixes.
- Use other clear types such as `docs`, `test`, `refactor`, `chore`, `build`, `ci`, `style`, `perf`, or `revert` when they best match the change.
- Use scopes when they clarify the affected area.
- Use `!` or a `BREAKING CHANGE:` footer for breaking changes.
- Use `!!` or an `INITIAL STABLE RELEASE:` footer only when intentionally promoting a pre-release line to `1.0.0`.

## Avoid

- Guessing commit type without reading the changed files
- Combining unrelated changes under one vague commit message
- Adding breaking-change or initial-stable-release signals unless explicitly warranted
- Using broad messages such as `update files` or `misc changes`
