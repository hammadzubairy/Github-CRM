import type { Metadata } from "next";
import { DataGate } from "@/features/dashboard/components/data-gate";
import { ServicesView } from "@/features/services/components/services-view";

export const metadata: Metadata = { title: "Services" };

export default function ServicesPage() {
  return (
    <DataGate>
      <ServicesView />
    </DataGate>
  );
}
