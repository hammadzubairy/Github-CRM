import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutView } from "@/features/billing/components/checkout-view";
import { DashboardSkeleton, DataGate } from "@/features/dashboard/components/data-gate";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DataGate>
        <CheckoutView />
      </DataGate>
    </Suspense>
  );
}
