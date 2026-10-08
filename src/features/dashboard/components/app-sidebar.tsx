"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLinkIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { getPlan } from "@/lib/plans";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { isActivePath, manageNav, primaryNav, type NavItem } from "../nav";
import { UserMenu } from "./user-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";

function NavGroup(props: { label: string; items: NavItem[]; badges?: Record<string, number> }) {
  return (
    <Suspense fallback={<NavGroupLinks {...props} pathname="" />}>
      <NavGroupWithPath {...props} />
    </Suspense>
  );
}

function NavGroupWithPath(props: { label: string; items: NavItem[]; badges?: Record<string, number> }) {
  return <NavGroupLinks {...props} pathname={usePathname()} />;
}

function NavGroupLinks({
  label,
  items,
  badges,
  pathname,
}: {
  label: string;
  items: NavItem[];
  badges?: Record<string, number>;
  pathname: string;
}) {
  const { setOpenMobile, isMobile } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = isActivePath(pathname, item.href);
            const badge = badges?.[item.href];
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={`${item.title}  ·  G ${item.shortcut}`}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => isMobile && setOpenMobile(false)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {badge ? <SidebarMenuBadge className="text-[11px]">{badge}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function UsageCard() {
  const business = useActiveBusiness();
  const staff = useScoped("staff");
  if (!business) return null;
  const plan = getPlan(business.plan);
  if (plan.id === "business") return null;
  const limit = plan.limits.staff ?? staff.length;
  const pct = Math.min(100, Math.round((staff.length / limit) * 100));
  return (
    <div className="rounded-lg border bg-background p-3 group-data-[collapsible=icon]:hidden">
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <SparklesIcon className="size-3.5 text-primary" /> {plan.name} plan
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {staff.length} of {limit} staff seats used
      </p>
      <Progress value={pct} className="mt-2 h-1.5" aria-label="Staff seats used" />
      <Button asChild size="xs" className="mt-3 w-full">
        <Link href="/app/billing">Upgrade</Link>
      </Button>
    </div>
  );
}

export function AppSidebar() {
  const business = useActiveBusiness();
  const appointments = useScoped("appointments");
  const pending = appointments.filter((a) => a.status === "pending").length;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup
          label="Workspace"
          items={primaryNav}
          badges={pending ? { "/app/calendar": pending } : undefined}
        />
        <NavGroup label="Manage" items={manageNav} />
        {business ? (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Public booking page">
                    <a href={`/book/${business.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                      <span>Booking page</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <UsageCard />
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
