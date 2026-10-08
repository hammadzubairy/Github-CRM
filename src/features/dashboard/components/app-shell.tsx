"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppointmentDialog } from "@/features/calendar/components/appointment-dialog";
import { useIsReady } from "@/lib/store/hooks";
import { useGlobalShortcuts } from "../hooks/use-global-shortcuts";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette } from "./command-palette";
import { useWorkspaceLoader } from "./data-gate";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  useWorkspaceLoader();
  useGlobalShortcuts();
  const ready = useIsReady();

  return (
    <TooltipProvider delayDuration={200}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset id="main" className="min-w-0">
          <Topbar />
          {children}
        </SidebarInset>
        {ready ? (
          <>
            <CommandPalette />
            <AppointmentDialog />
          </>
        ) : null}
        <ShortcutsDialog />
        <Toaster />
      </SidebarProvider>
    </TooltipProvider>
  );
}
