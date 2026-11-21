"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Keep a text field's value on the device.
 *
 * The plan requires every tool page to save the pasted list and put it back on
 * the next visit (prd.md 112/128): the list stays on the device, there to pick
 * up tomorrow. The first render is empty so the server-rendered markup and the
 * client's first paint agree; the stored value arrives in an effect, and every
 * later change is written straight back.
 */
export function useStoredList(key: string, initial = "") {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const wrote = useRef(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(key);
    } catch {
      /* storage can be blocked by the browser's settings */
    }
    if (stored !== null && stored !== "") setValue(stored);
    setReady(true);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, value);
      wrote.current = true;
    } catch {
      /* storage may be blocked or full; the tool still works for this visit */
    }
  }, [key, ready, value]);

  /** Write the current value now (used before a download or a reload). */
  const flush = (next: string) => {
    try {
      window.localStorage.setItem(key, next);
    } catch {
      /* ignore */
    }
  };

  return [value, setValue, flush] as const;
}
