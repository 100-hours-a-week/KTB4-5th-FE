"use client";

import { useEffect, useRef, useState } from "react";

const RETRY_COOLDOWN_MS = 60_000;

type RetryResult = { isSuccess: boolean };

export function useRetryControl() {
  const [retryingError, setRetryingError] = useState<{ error: unknown } | null>(
    null,
  );
  const [failureCount, setFailureCount] = useState(1);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const inFlightRef = useRef(false);
  const failureCountRef = useRef(1);
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    if (cooldownUntil <= now) return;

    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil, now]);

  function recordFailure() {
    const nextCount = failureCountRef.current + 1;
    failureCountRef.current = nextCount;
    setFailureCount(nextCount);

    if (nextCount >= 5) {
      const until = Date.now() + RETRY_COOLDOWN_MS;
      cooldownUntilRef.current = until;
      setCooldownUntil(until);
      setNow(Date.now());
    }
  }

  async function retry(error: unknown, refetch: () => Promise<RetryResult>) {
    if (inFlightRef.current || Date.now() < cooldownUntilRef.current) return;

    inFlightRef.current = true;
    setRetryingError({ error });

    try {
      const result = await refetch();
      if (result.isSuccess) {
        failureCountRef.current = 1;
        setFailureCount(1);
        cooldownUntilRef.current = 0;
        setCooldownUntil(0);
      } else {
        recordFailure();
      }
    } catch {
      recordFailure();
    } finally {
      inFlightRef.current = false;
      setRetryingError(null);
    }
  }

  return {
    retry,
    retryingError,
    failureCount,
    cooldownSeconds: Math.max(0, Math.ceil((cooldownUntil - now) / 1_000)),
  };
}
