export const PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS = 25;

export type PasswordRecoveryError = Error & {
  retryAfterSeconds?: number;
  statusCode?: number;
};

function parseRetryAfterFromText(text: string) {
  const secondsMatch = text.match(/after\s+(\d+)\s+seconds?/i);
  if (secondsMatch) {
    return Number(secondsMatch[1]);
  }

  const securityMatch = text.match(/only request this after\s+(\d+)\s+seconds?/i);
  if (securityMatch) {
    return Number(securityMatch[1]);
  }

  return null;
}

export function getPasswordRecoveryRetryAfterSeconds(error: unknown) {
  const anyError = error as {
    message?: string;
    status?: number;
    code?: string | number;
    retryAfterSeconds?: number;
  } | null;

  if (!anyError) {
    return null;
  }

  if (typeof anyError.retryAfterSeconds === "number" && anyError.retryAfterSeconds > 0) {
    return Math.ceil(anyError.retryAfterSeconds);
  }

  const text = `${anyError.message || ""} ${String(anyError.code || "")}`.trim();
  const parsed = parseRetryAfterFromText(text);
  if (typeof parsed === "number" && parsed > 0) {
    return parsed;
  }

  const normalized = text.toLowerCase();
  if (anyError.status === 429 || normalized.includes("too many requests") || normalized.includes("for security purposes")) {
    return PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS;
  }

  return null;
}

export function formatPasswordRecoveryCooldownMessage(retryAfterSeconds: number) {
  const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
  return `Aguarde ${seconds}s antes de solicitar um novo e-mail de redefinição.`;
}

export function createPasswordRecoveryError(error: unknown, fallbackMessage: string) {
  const retryAfterSeconds = getPasswordRecoveryRetryAfterSeconds(error);
  const message = retryAfterSeconds
    ? formatPasswordRecoveryCooldownMessage(retryAfterSeconds)
    : fallbackMessage;

  return Object.assign(new Error(message), {
    retryAfterSeconds: retryAfterSeconds ?? undefined,
    statusCode: retryAfterSeconds ? 429 : undefined,
  }) as PasswordRecoveryError;
}