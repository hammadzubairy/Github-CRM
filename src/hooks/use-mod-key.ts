"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Returns the platform modifier label, resolved after hydration to avoid mismatches. */
export function useModKey(): string {
  return useSyncExternalStore(
    subscribe,
    () => (/Mac|iPhone|iPad/i.test(navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "⌘",
  );
}
