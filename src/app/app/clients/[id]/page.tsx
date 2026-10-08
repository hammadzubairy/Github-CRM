import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientDetail } from "@/features/clients/components/client-detail";
import { DashboardSkeleton, DataGate } from "@/features/dashboard/components/data-gate";

export const metadata: Metadata = { title: "Client" };

export default function ClientPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DataGate>
        <ClientDetail />
      </DataGate>
    </Suspense>
  );
}
