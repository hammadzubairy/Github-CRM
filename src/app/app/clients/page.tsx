import type { Metadata } from "next";
import { ClientsView } from "@/features/clients/components/clients-table";
import { DataGate } from "@/features/dashboard/components/data-gate";

export const metadata: Metadata = { title: "Clients" };

export default function ClientsPage() {
  return (
    <DataGate>
      <ClientsView />
    </DataGate>
  );
}
