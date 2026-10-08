"use client";

import { Kbd } from "@/components/kbd";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useModKey } from "@/hooks/use-mod-key";
import { useUiStore } from "@/lib/store/ui-store";
import { allNav } from "../nav";

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);
  const mod = useModKey();

  const groups: { title: string; items: { label: string; keys: string[] }[] }[] = [
    {
      title: "General",
      items: [
        { label: "Open command palette", keys: [mod, "K"] },
        { label: "Toggle sidebar", keys: [mod, "B"] },
        { label: "New booking", keys: ["N"] },
        { label: "Show shortcuts", keys: ["?"] },
        { label: "Switch workspace", keys: ["⌥", "1–9"] },
      ],
    },
    {
      title: "Navigation",
      items: allNav.map((item) => ({ label: `Go to ${item.title}`, keys: ["G", item.shortcut] })),
    },
    {
      title: "Calendar",
      items: [
        { label: "Previous / next period", keys: ["←", "→"] },
        { label: "Jump to today", keys: ["T"] },
        { label: "Day / week / month view", keys: ["D", "W", "M"] },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Move faster around FlowDesk without leaving the keyboard.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] gap-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section key={group.title}>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </h3>
              <ul className="divide-y rounded-lg border">
                {group.items.map((item) => (
                  <li key={item.label} className="flex items-center justify-between px-3 py-2 text-sm">
                    {item.label}
                    <span className="flex gap-1">
                      {item.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
