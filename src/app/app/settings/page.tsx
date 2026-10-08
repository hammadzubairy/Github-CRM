import type { Metadata } from "next";
import { DataGate } from "@/features/dashboard/components/data-gate";
import { SettingsView } from "@/features/settings/components/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <DataGate>
      <SettingsView />
    </DataGate>
  );
}
