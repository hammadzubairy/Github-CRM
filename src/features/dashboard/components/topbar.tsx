"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Kbd } from "@/components/kbd";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useModKey } from "@/hooks/use-mod-key";
import { useAppStore } from "@/lib/store/app-store";
import { useUiStore } from "@/lib/store/ui-store";
import { allNav, isActivePath } from "../nav";
import { NotificationsMenu } from "./notifications-menu";

function Breadcrumbs() {
  const pathname = usePathname();
  const clients = useAppStore((s) => s.clients);
  const section = [...allNav].reverse().find((item) => isActivePath(pathname, item.href)) ?? allNav[0];
  const crumbs: { label: string; href?: string }[] = [{ label: section.title, href: section.href }];
  const rest = pathname.slice(section.href.length).split("/").filter(Boolean);
  if (section.href === "/app/clients" && rest[0]) {
    crumbs.push({ label: clients.find((c) => c.id === rest[0])?.name ?? "Client" });
  } else if (section.href === "/app/billing" && rest[0] === "checkout") {
    crumbs.push({ label: "Checkout" });
  }

  return (
    <ol className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1;
        return (
          <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
            {i > 0 ? (
              <span className="text-muted-foreground/60" aria-hidden>
                /
              </span>
            ) : null}
            {last || !crumb.href ? (
              <span className="truncate font-medium" aria-current={last ? "page" : undefined}>
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="truncate text-muted-foreground hover:text-foreground">
                {crumb.label}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Topbar() {
  const mod = useModKey();
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const openNewAppointment = useUiStore((s) => s.openNewAppointment);

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 rounded-t-xl border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <Suspense fallback={null}>
          <Breadcrumbs />
        </Suspense>
      </nav>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCommandOpen(true)}
        className="hidden w-56 justify-start gap-2 text-muted-foreground md:inline-flex"
      >
        <SearchIcon />
        <span className="flex-1 text-left">Search…</span>
        <Kbd>{mod === "⌘" ? "⌘K" : `${mod} K`}</Kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setCommandOpen(true)}
      >
        <SearchIcon />
      </Button>
      <NotificationsMenu />
      <ThemeToggle className="hidden sm:inline-flex" />
      <Button size="sm" onClick={() => openNewAppointment()} className="gap-1.5">
        <PlusIcon />
        <span className="hidden sm:inline">New booking</span>
        <Kbd className="hidden border-primary-foreground/25 bg-primary-foreground/15 text-primary-foreground lg:inline-flex">
          N
        </Kbd>
      </Button>
    </header>
  );
}
