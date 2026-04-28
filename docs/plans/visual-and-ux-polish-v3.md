# Visual And UX Polish V3

## Goal

Raise the presentation quality of the current Bomberman prototype without changing the authoritative gameplay model.

## Summary

This track improves clarity and feel:

- better tile and prop visuals
- stronger feedback for bomb fuse, blast, pickup, death, and win states
- cleaner HUD hierarchy

## Key Decisions

- keep Phaser-based primitive or sprite-sheet rendering, depending on asset readiness
- prioritize readability over decorative effects
- treat animation and sound as client-only feedback layers driven by existing server state

## Planned Changes

- replace placeholder rectangles with a more distinctive map palette
- add bomb fuse pulse, blast flash, and pickup pop effects
- improve result and countdown presentation
- refine HUD grouping for match state, inventory, and outcome
- optionally add lightweight sound hooks for pickup, blast, and KO

## Test Focus

- visual feedback always follows authoritative state
- round resets do not leave stale animations or overlays
- mobile and desktop layouts remain usable

## Why This Comes Next

- it turns the working prototype into a more legible demo
- it can be layered on top of either the power-up track or the room track
