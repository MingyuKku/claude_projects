import { useEffect, useState } from "react";

/**
 * Verification-code validity countdown.
 *
 * Remaining time comes from a wall-clock deadline, not a tick count, because
 * setInterval is throttled in background tabs: after the user switches to the
 * KakaoTalk app and back, skipped ticks would show more time than is left.
 */

const DEFAULT_SECONDS = 60;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const TICK_INTERVAL_MS = MS_PER_SECOND;

/** Seconds until the deadline, rounded up. 0 once it has passed. */
export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / MS_PER_SECOND));
}

/** mm:ss */
export function formatCountdown(seconds: number): string {
  const minutes = String(Math.floor(seconds / SECONDS_PER_MINUTE)).padStart(
    2,
    "0",
  );
  return `${minutes}:${String(seconds % SECONDS_PER_MINUTE).padStart(2, "0")}`;
}

interface CountdownState {
  /** Epoch ms. null until started. */
  deadline: number | null;
  /** Last sampled clock; only moves while the interval runs. */
  now: number;
  isRunning: boolean;
}

const IDLE_STATE: CountdownState = { deadline: null, now: 0, isRunning: false };

export function useCountdown() {
  const [state, setState] = useState<CountdownState>(IDLE_STATE);
  const { deadline, now, isRunning } = state;

  const secondsLeft = deadline === null ? 0 : remainingSeconds(deadline, now);
  const isTicking = isRunning && secondsLeft > 0;

  useEffect(() => {
    if (!isTicking) return;
    const timer = setInterval(() => {
      setState((prev) => ({ ...prev, now: Date.now() }));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isTicking, deadline]);

  function start(seconds = DEFAULT_SECONDS) {
    const startedAt = Date.now();
    // Start at the full value; waiting for the first tick would lose a second.
    setState({
      deadline: startedAt + seconds * MS_PER_SECOND,
      now: startedAt,
      isRunning: true,
    });
  }

  function stop() {
    setState((prev) => ({ ...prev, isRunning: false }));
  }

  /** Real elapsed time, not the displayed value. Before the first start, counts as expired. */
  function isExpired() {
    return deadline === null || Date.now() >= deadline;
  }

  return {
    secondsLeft,
    text: formatCountdown(secondsLeft),
    start,
    stop,
    isExpired,
  };
}
