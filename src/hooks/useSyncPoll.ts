"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseSyncPollOptions = {
  intervalMs?: number;
  enabled?: boolean;
};

export function useSyncPoll<T>(
  fetcher: () => Promise<T>,
  { intervalMs = 100, enabled = true }: UseSyncPollOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const fetcherRef = useRef(fetcher);
  const inFlightRef = useRef(false);
  const pendingRef = useRef(false);

  fetcherRef.current = fetcher;

  const poll = useCallback(async () => {
    if (!enabled) return;
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }

    inFlightRef.current = true;
    try {
      const next = await fetcherRef.current();
      setData(next);
    } catch {
      setData(null);
    } finally {
      inFlightRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void poll();
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    void poll();
    const intervalId = window.setInterval(() => {
      void poll();
    }, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, intervalMs, poll]);

  return { data, refresh: poll };
}
