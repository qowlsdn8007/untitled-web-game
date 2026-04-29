# Conventional Commits 1.0.0-next Quick Reference

Load this reference when strict draft behavior matters, such as validating messages, configuring tooling, generating release notes, or deciding whether a message implies a SemVer bump.

## Required Structure

```text
<type>[optional scope][optional !][optional second !]: <description>

[optional body]

[optional footer(s)]
```

- The prefix must contain a type noun, optional scope, optional `!`, optional second `!`, and a terminal colon followed by one space.
- `feat` must be used for new application or library features.
- `fix` must be used for application bug fixes.
- The description must immediately follow the prefix.
- A body may follow the description after one blank line.
- Footers may follow the body after one blank line.

## Footer Rules

Each footer consists of a token, then either `: ` or ` #`, then a value.

- Footer tokens use `-` instead of whitespace, except `BREAKING CHANGE` and `INITIAL STABLE RELEASE`.
- Footer values may contain spaces and newlines.
- Footer parsing stops when another valid footer token/separator pair is observed.
- `BREAKING-CHANGE` is synonymous with `BREAKING CHANGE`.
- `BREAKING CHANGE` and `INITIAL STABLE RELEASE` must be uppercase when used as special footer tokens.

Examples:

```text
Reviewed-by: Z
Refs: #123
BREAKING CHANGE: environment variables now take precedence over config files
INITIAL STABLE RELEASE: the API is ready for general public use
```

## SemVer Interpretation

- `fix` maps to PATCH.
- `feat` maps to MINOR.
- Any type can include a breaking change signal.
- For versions `>= 1.0.0`, breaking changes map to MAJOR.
- For pre-release `0.y.z` versions, breaking changes map to MINOR.
- An initial stable release signal maps a pre-release `0.y.z` line to `1.0.0`.
- Types other than `feat` and `fix` have no implicit SemVer effect unless they contain breaking or initial stable release signals.

## Breaking Change Signals

Use at least one of:

- `!` immediately before the colon in the type/scope prefix.
- A `BREAKING CHANGE:` footer.
- A `BREAKING-CHANGE:` footer.

If `!` is used, the footer may be omitted and the title description should describe the breaking change.

Examples:

```text
feat!: drop support for Node 6
feat(api)!: require signed requests
refactor!: replace legacy auth middleware

BREAKING CHANGE: auth middleware now requires a session adapter
```

## Initial Stable Release Signals

Use at least one of:

- `!!` immediately before the colon in the type/scope prefix.
- An `INITIAL STABLE RELEASE:` footer.

Examples:

```text
feat!!: publish stable API

INITIAL STABLE RELEASE: the API is ready for public use
```

## Common Examples

```text
docs: correct spelling of CHANGELOG
```

```text
feat(lang): add polish language
```

```text
fix: prevent racing of requests

Introduce a request id and a reference to the latest request. Dismiss
incoming responses other than from the latest request.

Reviewed-by: Z
Refs: #123
```

```text
revert: restore previous movement interpolation

Refs: 676104e, a215868
```
