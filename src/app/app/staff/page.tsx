import type { Metadata } from "next";
import { DataGate } from "@/features/dashboard/components/data-gate";
import { StaffView } from "@/features/staff/components/staff-view";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return (
    <DataGate>
      <StaffView />
    </DataGate>
  );
}
