import type { Metadata } from "next";
import { BillingView } from "@/features/billing/components/billing-view";
import { DataGate } from "@/features/dashboard/components/data-gate";

export const metadata: Metadata = { title: "Billing" };

export default function BillingPage() {
  return (
    <DataGate>
      <BillingView />
    </DataGate>
  );
}
