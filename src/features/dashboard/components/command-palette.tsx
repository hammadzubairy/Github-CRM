"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  KeyboardIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  UserPlusIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { initials } from "@/lib/format";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { allNav } from "../nav";
import { useSignOut } from "./user-menu";

export function CommandPalette() {
  const router = useRouter();
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);
  const setClientDialogOpen = useUiStore((s) => s.setClientDialogOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const businesses = useAppStore((s) => s.businesses);
  const setActiveBusiness = useAppStore((s) => s.setActiveBusiness);
  const business = useActiveBusiness();
  const clients = useScoped("clients");
  const { resolvedTheme, setTheme } = useTheme();
  const { signOut } = useSignOut();

  const sortedClients = useMemo(() => [...clients].sort((a, b) => a.name.localeCompare(b.name)), [clients]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command palette"
      description="Search for a page, client or action"
    >
      <Command>
        <CommandInput placeholder="Type a command or search clients…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick actions">
            <CommandItem onSelect={() => run(() => openNewAppointment())}>
              <CalendarPlusIcon /> New booking
              <CommandShortcut>N</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                run(() => {
                  router.push("/app/clients");
                  setClientDialogOpen(true);
                })
              }
            >
              <UserPlusIcon /> Add client
            </CommandItem>
            <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
              {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />} Toggle theme
            </CommandItem>
            {business ? (
              <CommandItem onSelect={() => run(() => window.open(`/book/${business.slug}`, "_blank"))}>
                <ExternalLinkIcon /> Open public booking page
              </CommandItem>
            ) : null}
            <CommandItem onSelect={() => run(() => setShortcutsOpen(true))}>
              <KeyboardIcon /> Keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigate">
            {allNav.map((item) => (
              <CommandItem
                key={item.href}
                value={`Go to ${item.title}`}
                onSelect={() => run(() => router.push(item.href))}
              >
                <item.icon /> {item.title}
                <CommandShortcut>G {item.shortcut}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
          {businesses.length > 1 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Workspaces">
                {businesses.map((b, i) => (
                  <CommandItem
                    key={b.id}
                    value={`Switch to ${b.name}`}
                    onSelect={() => run(() => setActiveBusiness(b.id))}
                  >
                    <span className="grid size-4 place-items-center rounded bg-primary/15 text-[9px] font-semibold text-primary">
                      {b.name.charAt(0)}
                    </span>
                    Switch to {b.name}
                    <CommandShortcut>⌥{i + 1}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading="Clients">
            {sortedClients.map((client) => (
              <CommandItem
                key={client.id}
                value={`${client.name} ${client.email}`}
                onSelect={() => run(() => router.push(`/app/clients/${client.id}`))}
              >
                <span className="grid size-5 place-items-center rounded-full bg-muted text-[9px] font-semibold">
                  {initials(client.name)}
                </span>
                <span className="truncate">{client.name}</span>
                <span className="ml-auto truncate text-xs text-muted-foreground">{client.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Account">
            <CommandItem onSelect={() => run(signOut)}>
              <LogOutIcon /> Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
