export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_BASE_DELAY_MS = 1200;

export type RetryContext = {
  attempt: number;
  maxRetries: number;
  delayMs: number;
};

export type RetryOptions = {
  label: string;
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, ctx: RetryContext) => void;
};

const nowIso = () => new Date().toISOString();

export function getRetryDelay(baseDelayMs: number, attempt: number) {
  return baseDelayMs * 2 ** (attempt - 1);
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function shouldRetryHttpLikeError(error: unknown) {
  if (!(error instanceof Error)) {
    return true;
  }

  const anyError = error as Error & { status?: number; code?: string };

  if (anyError.code === "TIMEOUT") {
    return true;
  }

  if (typeof anyError.status === "number") {
    if (anyError.status >= 500) return true;
    if (anyError.status === 429 || anyError.status === 408) return true;
    return false;
  }

  return true;
}

export async function runWithRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const shouldRetry = options.shouldRetry ?? shouldRetryHttpLikeError;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }

      const delayMs = getRetryDelay(baseDelayMs, attempt);

      if (options.onRetry) {
        options.onRetry(error, { attempt, maxRetries, delayMs });
      } else {
        console.warn(
          `[${nowIso()}] ${options.label}: tentativa ${attempt}/${maxRetries} falhou, novo retry em ${delayMs}ms`,
          error
        );
      }

      await wait(delayMs);
    }
  }

  throw lastError;
}
