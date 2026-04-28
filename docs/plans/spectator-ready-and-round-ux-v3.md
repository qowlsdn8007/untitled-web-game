# Spectator, Ready, And Round UX V3

## Goal

Improve the match flow around death, round start, and round end without changing the current core combat rules.

## Summary

This track focuses on player experience:

- ready state before a round starts
- clearer start and end transitions
- spectator behavior after death
- more readable round results

## Key Decisions

- dead players remain connected and switch to spectator mode until round reset
- ready state is explicit, not inferred from connection alone
- rounds do not auto-start until enough players are both present and ready
- the camera follows the local live player and switches to a simple spectator target after death

## Planned Changes

- add `ready` state to player or match participation data
- add ready/unready UI control in the shell
- add countdown presentation in the HUD
- add spectator label and result overlays after death
- define camera fallback behavior when the local player is dead

## Test Focus

- a round cannot start with unready players
- a dead player cannot affect gameplay but can still observe
- countdown and result text stay in sync with match state

## Why This Comes Next

- it makes the existing loop feel much more complete
- it pairs naturally with room-based matches if that track is taken later
