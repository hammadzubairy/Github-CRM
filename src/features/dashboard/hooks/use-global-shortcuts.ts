"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/app-store";
import { useUiStore } from "@/lib/store/ui-store";
import { allNav } from "../nav";

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function useGlobalShortcuts() {
  const router = useRouter();
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ui = useUiStore.getState();

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ui.setCommandOpen(!ui.commandOpen);
        return;
      }

      if (event.altKey && /^Digit[1-9]$/.test(event.code)) {
        const index = Number(event.code.slice(5)) - 1;
        const business = useAppStore.getState().businesses[index];
        if (business) {
          event.preventDefault();
          useAppStore.getState().setActiveBusiness(business.id);
        }
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (ui.commandOpen || ui.appointmentDialog.open || document.querySelector("[role='dialog']")) return;

      const key = event.key.toLowerCase();

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const target = allNav.find((item) => item.shortcut.toLowerCase() === key);
        if (target) {
          event.preventDefault();
          router.push(target.href);
        }
        return;
      }

      if (key === "g") {
        pendingG.current = window.setTimeout(() => {
          pendingG.current = null;
        }, 900);
        return;
      }
      if (key === "n") {
        event.preventDefault();
        ui.openNewAppointment();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        ui.setShortcutsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (pendingG.current !== null) window.clearTimeout(pendingG.current);
    };
  }, [router]);
}
