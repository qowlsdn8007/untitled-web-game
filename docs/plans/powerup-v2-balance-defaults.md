# PowerUp V2 - Balance Defaults

## Goal

Define the initial balance values for the first power-up release so implementation can use fixed constants.

## Defaults

- `POWER_UP_DROP_CHANCE = 0.35`
- `POWER_UP_SPEED_INCREMENT = 20`
- `POWER_UP_MAX_BOMBS = 6`
- `POWER_UP_MAX_FLAME_RANGE = 8`
- `POWER_UP_MAX_SPEED = 360`

## Drop Distribution

Use weighted random selection after a successful drop roll:

- `bomb_up`: `0.34`
- `flame_up`: `0.33`
- `speed_up`: `0.33`

This keeps the first release simple and close to even distribution.

## Stat Behavior

- `bomb_up`
  - default start: `1`
  - per pickup: `+1`
  - hard cap: `6`

- `flame_up`
  - default start: `1`
  - per pickup: `+1`
  - hard cap: `8`

- `speed_up`
  - default start: current `PLAYER_SPEED`
  - per pickup: `+20`
  - hard cap: `360`

## Reset Policy

On round restart:

- `maxBombs` resets to `DEFAULT_BOMB_CAPACITY`
- `flameRange` resets to `DEFAULT_FLAME_RANGE`
- `moveSpeed` resets to `PLAYER_SPEED`
- all active `powerUps` are removed

## Notes

- these are implementation defaults, not final live balance
- if movement feels unstable after multiple `speed_up` pickups, reduce the increment before raising the cap
- if rounds snowball too hard, reduce `POWER_UP_DROP_CHANCE` before changing the three-item set
