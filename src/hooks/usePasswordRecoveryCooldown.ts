import { useEffect, useMemo, useState } from "react";
import { PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS } from "@/lib/passwordRecovery";

type CooldownMap = Record<string, number>;

function pruneExpiredCooldowns(entries: CooldownMap, now: number) {
  return Object.fromEntries(
    Object.entries(entries).filter(([, expiresAt]) => expiresAt > now),
  );
}

export function usePasswordRecoveryCooldown() {
  const [cooldowns, setCooldowns] = useState<CooldownMap>({});
  const [now, setNow] = useState(() => Date.now());

  const hasActiveCooldown = useMemo(() => {
    return Object.values(cooldowns).some((expiresAt) => expiresAt > now);
  }, [cooldowns, now]);

  useEffect(() => {
    if (!hasActiveCooldown) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      setCooldowns((current) => pruneExpiredCooldowns(current, nextNow));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hasActiveCooldown]);

  function startCooldown(key: string, seconds = PASSWORD_RECOVERY_MIN_INTERVAL_SECONDS) {
    const duration = Math.max(1, Math.ceil(seconds));
    const expiresAt = Date.now() + (duration * 1000);
    setNow(Date.now());
    setCooldowns((current) => ({
      ...current,
      [key]: expiresAt,
    }));
  }

  function getRemainingSeconds(key: string) {
    const expiresAt = cooldowns[key];
    if (!expiresAt) {
      return 0;
    }

    return Math.max(0, Math.ceil((expiresAt - now) / 1000));
  }

  function isCooldownActive(key: string) {
    return getRemainingSeconds(key) > 0;
  }

  return {
    getRemainingSeconds,
    isCooldownActive,
    startCooldown,
  };
}