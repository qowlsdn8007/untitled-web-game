# Room And Match Structure V3

## Goal

Prepare the project for multiple concurrent matches without changing the core Bomberman rules.

## Summary

This track introduces room partitioning and match-local state so that multiple groups can play independently.

## Key Decisions

- keep a lightweight lobby entry step before match join
- each room owns its own grid, players, bombs, flames, power-ups, and match state
- Socket.IO rooms become the transport boundary for all broadcasts
- current single-room logic should be extracted into a match-instance container, not duplicated conditionally

## Planned Changes

- create a server-side room registry and match instance model
- move global `gameState` into per-room state
- add join flow with room id or quick-match assignment
- scope `world:init`, `world:updated`, `match:state`, and `player:updated` to a single room
- keep the client UI minimal: room join/create plus current room status

## Test Focus

- players in different rooms do not receive each other’s events
- room teardown happens cleanly when the room becomes empty
- reconnect or rejoin cannot leak players across matches

## Why This Comes Next

- it unlocks private matches and parallel sessions
- it reduces the architectural cost of later lobby, spectator, and rematch features
