import type { Metadata } from "next";
import { DataGate } from "@/features/dashboard/components/data-gate";
import { OverviewView } from "@/features/overview/components/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <DataGate>
      <OverviewView />
    </DataGate>
  );
}
