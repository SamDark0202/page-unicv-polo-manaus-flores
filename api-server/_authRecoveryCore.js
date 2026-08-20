const PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS = 25;

function parseRetryAfterFromText(text) {
  if (!text) return null;

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

export function getPasswordRecoveryRetryAfterSeconds(error) {
  if (!error) return null;

  if (typeof error.retryAfterSeconds === "number" && error.retryAfterSeconds > 0) {
    return Math.ceil(error.retryAfterSeconds);
  }

  const text = `${error.message || ""} ${String(error.code || "")}`.trim();
  const parsed = parseRetryAfterFromText(text);
  if (typeof parsed === "number" && parsed > 0) {
    return parsed;
  }

  const normalized = text.toLowerCase();
  if (error.status === 429 || normalized.includes("too many requests") || normalized.includes("for security purposes")) {
    return PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS;
  }

  return null;
}

export function formatPasswordRecoveryCooldownMessage(retryAfterSeconds) {
  const seconds = Math.max(1, Math.ceil(retryAfterSeconds));
  return `Aguarde ${seconds}s antes de solicitar um novo e-mail de redefinição.`;
}

export function createPasswordRecoveryDeliveryError(error, fallbackMessage) {
  const retryAfterSeconds = getPasswordRecoveryRetryAfterSeconds(error);
  const wrapped = new Error(
    retryAfterSeconds ? formatPasswordRecoveryCooldownMessage(retryAfterSeconds) : fallbackMessage,
  );

  if (retryAfterSeconds) {
    wrapped.statusCode = 429;
    wrapped.retryAfterSeconds = retryAfterSeconds;
  }

  return wrapped;
}