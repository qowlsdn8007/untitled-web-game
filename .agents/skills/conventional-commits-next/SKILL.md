---
name: conventional-commits-next
description: Write, review, fix, or explain Conventional Commits messages using the 1.0.0-next draft rules, including type/scope syntax, SemVer impact, BREAKING CHANGE footers, and INITIAL STABLE RELEASE / !! handling. Use when Codex is asked to create commit messages, validate commit titles or bodies, choose commit types/scopes, prepare squash commit text, enforce Conventional Commits, or reason about release bumps from commit history.
---

# Conventional Commits Next

## Core Workflow

1. Inspect the actual diff or described change before choosing a type.
2. Prefer the smallest accurate commit message. Split unrelated change types into separate commits when practical.
3. Use imperative present tense for the description, lower-case consistently unless the repository already uses another style.
4. Include a body only when the title cannot explain motivation, behavior, or migration impact.
5. Include footers for breaking changes, initial stable release promotion, issue refs, reviewers, or other trailer-like metadata.

## Message Shape

Use this structure:

```text
<type>[optional scope][!|!!]: <description>

[optional body]

[optional footer(s)]
```

Use `feat` for new features and `fix` for bug fixes. Other types such as `build`, `chore`, `ci`, `docs`, `style`, `refactor`, `perf`, `test`, and `revert` are allowed when they best describe the change.

Scopes are optional nouns in parentheses, such as `feat(parser): add array parsing`.

## SemVer Signals

- `fix:` signals a PATCH change.
- `feat:` signals a MINOR change.
- `!` before the colon, or a `BREAKING CHANGE:` footer, signals a breaking change.
- `!!` before the colon, or an `INITIAL STABLE RELEASE:` footer, signals promotion from `0.y.z` to `1.0.0`.
- A commit can be both breaking and an initial stable release if both signals are present.

When the user asks for strict 1.0.0-next behavior, read `references/spec-quick-reference.md` before finalizing.

## Review Checklist

Check that:

- The title starts with a valid type, optional scope, optional `!` or `!!`, then `: `.
- The description is present and concise.
- The body, when present, begins after one blank line.
- Footers, when present, begin after one blank line and use trailer-like tokens.
- `BREAKING CHANGE` and `INITIAL STABLE RELEASE` footer tokens are uppercase exactly.
- `BREAKING-CHANGE` is accepted as synonymous with `BREAKING CHANGE` in footers.

## Output Style

When asked to write a commit message, return only the commit message unless the user asks for rationale. When asked to review or fix a message, show the corrected message first, then briefly note the issue.
