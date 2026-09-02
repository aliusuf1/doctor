"use client";

import { useEffect, useRef } from "react";

/**
 * Run `fn` on an interval, but only while the tab is visible — and run it
 * immediately when the tab regains focus, so returning to the page always
 * shows current data without a manual refresh.
 */
export function usePoll(
  fn: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState === "visible") void saved.current();
    };
    const start = () => {
      timer ??= setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void saved.current(); // catch up right away
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [intervalMs, enabled]);
}
