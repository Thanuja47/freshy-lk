interface AttemptRecord {
  count: number;
  resetTime: number;
}

const attemptStore = new Map<string, AttemptRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks and records an attempt for a client IP / identifier.
 * Returns true if allowed, false if rate limited.
 */
export function checkDemoLoginRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const record = attemptStore.get(identifier);

  if (!record || now > record.resetTime) {
    attemptStore.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Resets rate limit records (used in tests or successful logins).
 */
export function resetDemoLoginRateLimit(identifier?: string): void {
  if (identifier) {
    attemptStore.delete(identifier);
  } else {
    attemptStore.clear();
  }
}
