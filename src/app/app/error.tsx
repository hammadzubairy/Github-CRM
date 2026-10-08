"use client";

import Link from "next/link";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10">
          <TriangleAlertIcon className="size-5 text-destructive" />
        </span>
        <h1 className="mt-4 text-lg font-semibold">This view hit a snag</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The rest of your workspace is fine. Reload this section to try again.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">Reference {error.digest}</p>
        ) : null}
        <div className="mt-6 flex justify-center gap-2">
          <Button size="sm" onClick={() => retry()}>
            <RotateCwIcon /> Try again
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/app">Go to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
