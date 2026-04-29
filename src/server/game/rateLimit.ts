export function isWithinCooldown(lastActionAt: number | undefined, now: number, cooldownMs: number): boolean {
  return typeof lastActionAt === "number" && now - lastActionAt < cooldownMs;
}
