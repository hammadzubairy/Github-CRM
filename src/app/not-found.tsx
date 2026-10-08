import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CalendarSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/features/marketing/components/site-footer";
import { SiteHeader } from "@/features/marketing/components/site-header";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main" className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-24">
        <div aria-hidden className="bg-grid mask-radial absolute inset-0 -z-10 opacity-50" />
        <div className="max-w-md text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border bg-card shadow-sm">
            <CalendarSearchIcon className="size-6 text-primary" />
          </span>
          <p className="mt-6 text-sm font-medium text-primary">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">This slot is empty</h1>
          <p className="mt-3 text-muted-foreground">
            We couldn&apos;t find the page you were looking for. It may have moved, or the link might be out
            of date.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/">
                <ArrowLeftIcon /> Back to home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app">Open the demo</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
