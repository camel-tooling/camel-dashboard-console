/** Resolves after `ms` milliseconds. The async building block for polling. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polls `check` until it returns true, or throws when `timeoutMs` elapses.
 *
 * @param description  human-readable thing we're waiting for (used in the error)
 * @param check        returns true when the condition is met; may be sync or async
 * @param options      timeoutMs (default 5 min) and intervalMs (default 5 s)
 */
export async function waitFor(
  description: string,
  check: () => boolean | Promise<boolean>,
  options: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 300_000;
  const intervalMs = options.intervalMs ?? 5_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await check()) {
      return;
    }
    await sleep(intervalMs);
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for: ${description}`);
}
