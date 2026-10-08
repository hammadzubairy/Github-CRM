"use client";

import Link from "next/link";
import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main id="main" className="grid min-h-svh place-items-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-card shadow-sm">
          <TriangleAlertIcon className="size-6 text-destructive" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-muted-foreground">
          An unexpected error stopped this page from loading. Try again, or head back home.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-muted-foreground">Reference {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={() => retry()}>
            <RotateCwIcon /> Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
