/**
 * Resilience helpers for external calls: a per-attempt timeout and a bounded
 * retry with exponential backoff. Required for every state-changing connector
 * call (see `.claude/rules/40-connectors-and-actions.md`). Retries are only safe
 * because callers pass a stable idempotency key, so a re-sent request can't
 * double-execute.
 *
 * Backoff is deterministic (no random jitter) so the golden-path demo stays
 * reproducible. `sleep` is injectable so tests can run without real delays.
 */

/** Thrown when an attempt exceeds its time budget. */
export class TimeoutError extends Error {
  readonly code = 'timeout';

  constructor(label: string, timeoutMs: number) {
    super(`Operation "${label}" timed out after ${timeoutMs}ms.`);
    this.name = 'TimeoutError';
  }
}

export interface RetryOptions {
  /** Total attempts, including the first (so `1` means "no retries"). */
  readonly maxAttempts: number;
  /** Per-attempt timeout in milliseconds. */
  readonly timeoutMs: number;
  /** Base backoff delay; attempt N waits `baseDelayMs * 2^(N-1)`, capped. */
  readonly baseDelayMs: number;
  /** Upper bound on a single backoff delay. */
  readonly maxDelayMs: number;
  /** Injectable sleep — defaults to a real timer; tests pass a no-op. */
  readonly sleep: (ms: number) => Promise<void>;
  /** Decides whether a given error is worth retrying. */
  readonly isRetryable: (err: unknown) => boolean;
}

const realSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Default retryability: transient network failures, timeouts, and Stripe
 * rate-limit (429) / server (5xx) / connection errors. A 4xx like
 * "card declined" or "invalid request" is NOT retried — replaying it would just
 * fail again (or, worse, be a logic bug).
 */
export function defaultIsRetryable(err: unknown): boolean {
  if (err instanceof TimeoutError) {
    return true;
  }
  const record = err as { code?: unknown; type?: unknown; statusCode?: unknown; message?: unknown };

  const status = typeof record.statusCode === 'number' ? record.statusCode : undefined;
  if (status === 429 || (status !== undefined && status >= 500)) {
    return true;
  }

  const type = typeof record.type === 'string' ? record.type : '';
  if (type === 'StripeConnectionError' || type === 'StripeAPIError' || type === 'StripeRateLimitError') {
    return true;
  }

  const transientCodes = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'EAI_AGAIN',
    'ENETUNREACH',
    'EPIPE',
  ]);
  const code = typeof record.code === 'string' ? record.code : '';
  if (transientCodes.has(code)) {
    return true;
  }
  const message = typeof record.message === 'string' ? record.message : '';
  return [...transientCodes].some((c) => message.includes(c));
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  timeoutMs: 20_000,
  baseDelayMs: 200,
  maxDelayMs: 5_000,
  sleep: realSleep,
  isRetryable: defaultIsRetryable,
};

/** Resolve a partial override against the defaults. */
export function resolveRetryOptions(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return { ...DEFAULT_RETRY_OPTIONS, ...overrides };
}

/** Race an async operation against a timeout. Rejects with {@link TimeoutError}. */
export function withTimeout<T>(op: () => Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(label, timeoutMs));
    }, timeoutMs);

    op().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err as Error);
      },
    );
  });
}

function backoffDelay(attempt: number, options: RetryOptions): number {
  const exponential = options.baseDelayMs * 2 ** (attempt - 1);
  return Math.min(options.maxDelayMs, exponential);
}

/**
 * Run `op` with bounded retries and exponential backoff. Re-throws the last
 * error once attempts are exhausted or the error is non-retryable.
 */
export async function withRetry<T>(op: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    try {
      return await op();
    } catch (err) {
      lastError = err;
      const attemptsRemain = attempt < options.maxAttempts;
      if (!attemptsRemain || !options.isRetryable(err)) {
        throw err;
      }
      await options.sleep(backoffDelay(attempt, options));
    }
  }

  // Unreachable: the loop either returns or throws. Satisfies the type checker.
  throw lastError;
}
