"use client";

import { useEffect } from "react";
import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store/app-store";
import { detectDataMode } from "@/lib/store/hooks";

export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

/** Loads the workspace data once for the whole dashboard. */
export function useWorkspaceLoader() {
  const status = useAppStore((s) => s.status);
  const mode = useAppStore((s) => s.mode);

  useEffect(() => {
    void useAppStore.getState().init(detectDataMode());
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("welcome") === "1") {
      toast.success("Welcome to FlowDesk", {
        description:
          mode === "demo"
            ? "You are exploring a demo workspace. Changes stay in this browser."
            : "Your workspace is ready. Start by adding services and staff.",
      });
      url.searchParams.delete("welcome");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, [status, mode]);
}

/** Renders page content once workspace data is available. */
export function DataGate({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);

  if (status === "error") {
    return (
      <div className="grid min-h-[60vh] place-items-center p-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon className="size-5" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">We couldn&apos;t load your workspace</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error ?? "Something went wrong."}</p>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => {
              useAppStore.setState({ status: "idle" });
              void useAppStore.getState().init(detectDataMode());
            }}
          >
            <RotateCwIcon /> Try again
          </Button>
        </div>
      </div>
    );
  }

  if (status !== "ready") return <>{fallback ?? <DashboardSkeleton />}</>;
  return <>{children}</>;
}
