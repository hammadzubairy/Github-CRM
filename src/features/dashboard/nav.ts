import {
  CalendarDaysIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  ScissorsIcon,
  SettingsIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Second key of the "G then X" navigation shortcut. */
  shortcut: string;
}

export const primaryNav: NavItem[] = [
  { title: "Overview", href: "/app", icon: LayoutDashboardIcon, shortcut: "O" },
  { title: "Calendar", href: "/app/calendar", icon: CalendarDaysIcon, shortcut: "C" },
  { title: "Clients", href: "/app/clients", icon: UsersIcon, shortcut: "L" },
];

export const manageNav: NavItem[] = [
  { title: "Services", href: "/app/services", icon: ScissorsIcon, shortcut: "V" },
  { title: "Staff", href: "/app/staff", icon: UsersRoundIcon, shortcut: "T" },
  { title: "Billing", href: "/app/billing", icon: CreditCardIcon, shortcut: "B" },
  { title: "Settings", href: "/app/settings", icon: SettingsIcon, shortcut: "S" },
];

export const allNav = [...primaryNav, ...manageNav];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}
