"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import {
  CheckIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  Loader2Icon,
  ReceiptTextIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BillingToggle } from "@/features/marketing/components/pricing-section";
import { EmptyState, PageContainer, PageHeader } from "@/features/dashboard/components/page-header";
import { formatCurrency } from "@/lib/format";
import { getPlan, planPrice, plans, type BillingInterval, type Plan, type PlanId } from "@/lib/plans";
import { useAppStore } from "@/lib/store/app-store";
import { useActiveBusiness, useScoped } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { openReceipt } from "../receipt";
import { openBillingPortal, startCheckout } from "../start-checkout";

const rank: Record<PlanId, number> = { free: 0, pro: 1, business: 2 };

export function BillingView() {
  const router = useRouter();
  const business = useActiveBusiness();
  const mode = useAppStore((s) => s.mode);
  const applyPlan = useAppStore((s) => s.applyPlan);
  const staff = useScoped("staff");
  const appointments = useScoped("appointments");
  const invoices = useScoped("invoices");
  const [interval, setBillingInterval] = useState<BillingInterval>(business?.planInterval ?? "monthly");
  const [pending, setPending] = useState<PlanId | "portal" | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);
  const [monthStart] = useState(() => startOfMonth(new Date()));

  const current = getPlan(business?.plan ?? "free");
  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [invoices],
  );
  const bookingsThisMonth = useMemo(
    () => appointments.filter((a) => new Date(a.createdAt) >= monthStart && a.status !== "cancelled").length,
    [appointments, monthStart],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("checkout");
    if (!result) return;
    if (result === "success") {
      toast.success("Subscription updated", { description: "Thanks! Your new plan is active." });
      if (useAppStore.getState().mode === "supabase") {
        useAppStore.setState({ status: "idle" });
        void useAppStore.getState().init("supabase");
      }
    } else if (result === "cancelled") {
      toast("Checkout cancelled", { description: "No changes were made to your plan." });
    }
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);

  if (!business) return null;

  const choosePlan = async (plan: Plan) => {
    if (plan.id === "free") {
      setConfirmDowngrade(true);
      return;
    }
    setPending(plan.id);
    const url = await startCheckout({ mode, businessId: business.id, plan: plan.id, interval });
    if (!url) {
      setPending(null);
      return;
    }
    if (url.startsWith("/")) router.push(url);
    else window.location.assign(url);
  };

  const manageBilling = async () => {
    setPending("portal");
    const url = await openBillingPortal(business.id);
    if (url) window.location.assign(url);
    else setPending(null);
  };

  const downgrade = async () => {
    setConfirmDowngrade(false);
    if (mode === "supabase") {
      await manageBilling();
      return;
    }
    const ok = await applyPlan("free", "monthly");
    if (ok) toast.success("You're now on the Free plan");
  };

  const staffLimit = current.limits.staff;
  const bookingLimit = current.limits.bookingsPerMonth;
  const isPaid = current.id !== "free";

  return (
    <PageContainer>
      <PageHeader
        title="Billing"
        description="Manage your plan, payment details and invoices."
        actions={
          mode === "supabase" && isPaid ? (
            <Button size="sm" variant="outline" onClick={manageBilling} disabled={pending === "portal"}>
              {pending === "portal" ? <Loader2Icon className="animate-spin" /> : <ExternalLinkIcon />} Manage
              in Stripe
            </Button>
          ) : null
        }
      />

      <section className="grid gap-4 lg:grid-cols-3" aria-label="Current plan">
        <div className="relative overflow-hidden rounded-xl border bg-card p-5 lg:col-span-2">
          <div
            aria-hidden
            className="glow pointer-events-none absolute -top-24 -right-24 size-64 opacity-40"
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current plan</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight">{current.name}</h2>
                {isPaid ? (
                  <Badge variant="secondary" className="capitalize">
                    {business.planInterval}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isPaid
                  ? `${formatCurrency(planPrice(current, business.planInterval) * (business.planInterval === "yearly" ? 12 : 1), "USD")} per ${
                      business.planInterval === "yearly" ? "year" : "month"
                    }${business.currentPeriodEnd ? ` · renews ${format(new Date(business.currentPeriodEnd), "MMM d, yyyy")}` : ""}`
                  : "Free forever. Upgrade any time to unlock more staff and analytics."}
              </p>
            </div>
            {current.id !== "business" ? (
              <Button
                size="sm"
                onClick={() => choosePlan(getPlan(current.id === "free" ? "pro" : "business"))}
                disabled={pending !== null}
              >
                <SparklesIcon /> Upgrade to {current.id === "free" ? "Pro" : "Business"}
              </Button>
            ) : null}
          </div>
          <div className="relative mt-6 grid gap-5 sm:grid-cols-2">
            <UsageMeter label="Staff seats" used={staff.length} limit={staffLimit} />
            <UsageMeter label="Bookings this month" used={bookingsThisMonth} limit={bookingLimit} />
          </div>
        </div>

        <div className="flex flex-col rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Payment method</p>
          {isPaid ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-9 w-12 place-items-center rounded-md bg-gradient-to-br from-zinc-800 to-zinc-950 text-[10px] font-bold tracking-wider text-white">
                VISA
              </span>
              <div className="text-sm">
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-muted-foreground">
                  Expires 12/{String(new Date().getFullYear() + 3).slice(2)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <CreditCardIcon className="size-5" /> No card on file
            </div>
          )}
          <p className="mt-auto pt-4 text-xs text-muted-foreground">
            {mode === "demo"
              ? "Demo workspace: payments use a simulated checkout. No real charges."
              : "Payments are processed securely by Stripe."}
          </p>
        </div>
      </section>

      <section aria-labelledby="plans-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="plans-heading" className="text-base font-semibold">
            Plans
          </h2>
          <BillingToggle value={interval} onChange={setBillingInterval} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent =
              plan.id === current.id && (plan.id === "free" || interval === business.planInterval);
            const price = planPrice(plan, interval);
            const isUpgrade = rank[plan.id] > rank[current.id];
            const isSwitch = plan.id === current.id && !isCurrent;
            return (
              <div
                key={plan.id}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-5",
                  isCurrent && "border-primary/50 ring-1 ring-primary/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {isCurrent ? (
                    <Badge>Current</Badge>
                  ) : plan.highlighted ? (
                    <Badge variant="secondary">Popular</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-3xl font-semibold tracking-tight tabular-nums">${price}</span>
                  <span className="text-sm text-muted-foreground"> / month</span>
                </p>
                <p className="h-5 text-xs text-muted-foreground">
                  {price === 0
                    ? "Free forever"
                    : interval === "yearly"
                      ? `$${price * 12} billed yearly`
                      : "Billed monthly"}
                </p>
                <ul className="mt-4 mb-5 space-y-2 text-sm">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-auto"
                  variant={isUpgrade ? "default" : "outline"}
                  disabled={isCurrent || pending !== null}
                  onClick={() => choosePlan(plan)}
                >
                  {pending === plan.id ? <Loader2Icon className="animate-spin" /> : null}
                  {isCurrent
                    ? "Current plan"
                    : isSwitch
                      ? `Switch to ${interval}`
                      : isUpgrade
                        ? `Upgrade to ${plan.name}`
                        : `Downgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="invoices-heading" className="space-y-4">
        <h2 id="invoices-heading" className="text-base font-semibold">
          Invoices
        </h2>
        {sortedInvoices.length === 0 ? (
          <EmptyState
            icon={ReceiptTextIcon}
            title="No invoices yet"
            description="Invoices appear here after your first payment."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-12 pr-4">
                    <span className="sr-only">Receipt</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="pl-4 font-medium tabular-nums">{inv.number}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(inv.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{getPlan(inv.plan).name}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset",
                          inv.status === "paid"
                            ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
                            : inv.status === "open"
                              ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400"
                              : "bg-muted text-muted-foreground ring-border",
                        )}
                      >
                        {inv.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(inv.amount, "USD")}
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Open receipt ${inv.number}`}
                        onClick={() => openReceipt(inv, business)}
                      >
                        <ReceiptTextIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <AlertDialog open={confirmDowngrade} onOpenChange={setConfirmDowngrade}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Downgrade to Free?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll keep your data, but the Free plan includes 1 staff calendar and 50 bookings per
              month.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep {current.name}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={downgrade}>
              Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used}
          <span className="text-muted-foreground"> / {limit ?? "∞"}</span>
        </span>
      </div>
      <Progress
        value={limit ? pct : 8}
        aria-label={label}
        className={cn("mt-2 h-1.5", limit && pct >= 90 && "[&>div]:bg-amber-500")}
      />
    </div>
  );
}
