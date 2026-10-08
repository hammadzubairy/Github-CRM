import type { Metadata } from "next";
import { AppShell } from "@/features/dashboard/components/app-shell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · FlowDesk" },
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
