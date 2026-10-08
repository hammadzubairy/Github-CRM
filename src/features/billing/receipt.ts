import { format } from "date-fns";
import type { Business, Invoice } from "@/lib/data/types";
import { formatCurrency } from "@/lib/format";
import { getPlan } from "@/lib/plans";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

/** Opens a printable receipt for an invoice in a new tab. */
export function openReceipt(invoice: Invoice, business: Business) {
  const plan = getPlan(invoice.plan);
  const amount = formatCurrency(invoice.amount, "USD");
  const period = `${format(new Date(invoice.periodStart), "MMM d, yyyy")} – ${format(new Date(invoice.periodEnd), "MMM d, yyyy")}`;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Receipt ${escapeHtml(invoice.number)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;color:#18181b;max-width:640px;margin:48px auto;padding:0 24px}
  h1{font-size:20px;margin:0}.muted{color:#71717a;font-size:14px}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e4e4e7;font-size:14px}
  .total{font-weight:600;font-size:16px;border-bottom:0}.badge{display:inline-block;padding:2px 8px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:500}
  header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}button{margin-top:32px;padding:8px 14px;border-radius:8px;border:1px solid #e4e4e7;background:#fff;cursor:pointer}
  @media print{button{display:none}}
</style></head><body>
<header><div><h1>FlowDesk</h1><p class="muted">Receipt ${escapeHtml(invoice.number)}</p></div><span class="badge">${escapeHtml(invoice.status.toUpperCase())}</span></header>
<p class="muted">Billed to</p><p><strong>${escapeHtml(business.name)}</strong><br>${escapeHtml(business.email)}<br>${escapeHtml(business.address)}</p>
<div class="row"><span>Date</span><span>${format(new Date(invoice.createdAt), "MMMM d, yyyy")}</span></div>
<div class="row"><span>FlowDesk ${escapeHtml(plan.name)} plan<br><span class="muted">${period}</span></span><span>${amount}</span></div>
<div class="row"><span>Tax</span><span>${formatCurrency(0, "USD")}</span></div>
<div class="row total"><span>Total paid</span><span>${amount}</span></div>
<button onclick="window.print()">Print or save as PDF</button>
</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
