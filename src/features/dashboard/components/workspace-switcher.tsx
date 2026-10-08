"use client";

import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlan } from "@/lib/plans";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness } from "@/lib/store/hooks";

function WorkspaceAvatar({ name, hue, size = "md" }: { name: string; hue: number; size?: "sm" | "md" }) {
  return (
    <span
      className={
        size === "md"
          ? "grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white"
          : "grid size-6 shrink-0 place-items-center rounded-md text-xs font-semibold text-white"
      }
      style={{ background: `linear-gradient(135deg, oklch(0.6 0.2 ${hue}), oklch(0.5 0.22 ${hue + 40}))` }}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const businesses = useAppStore((s) => s.businesses);
  const setActive = useAppStore((s) => s.setActiveBusiness);
  const ready = useAppStore((s) => s.status === "ready");
  const active = useActiveBusiness();

  if (!ready || !active) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="size-8 rounded-lg" />
        <div className="flex-1 space-y-1.5 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent"
              aria-label="Switch workspace"
            >
              <WorkspaceAvatar name={active.name} hue={active.accentHue} />
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">{active.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {getPlan(active.plan).name} plan
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
            {businesses.map((b, i) => (
              <DropdownMenuItem
                key={b.id}
                onSelect={() => {
                  setActive(b.id);
                  toast.success(`Switched to ${b.name}`);
                }}
                className="gap-2"
              >
                <WorkspaceAvatar name={b.name} hue={b.accentHue} size="sm" />
                <span className="flex-1 truncate">{b.name}</span>
                {b.id === active.id ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <DropdownMenuShortcut>⌥{i + 1}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              onSelect={() =>
                toast.info("Multiple locations are part of the Business plan", {
                  description: "This demo already includes two workspaces to explore.",
                })
              }
            >
              <span className="grid size-6 place-items-center rounded-md border">
                <PlusIcon className="size-3.5" />
              </span>
              Add workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
