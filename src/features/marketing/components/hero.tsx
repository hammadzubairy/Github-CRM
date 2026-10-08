import Link from "next/link";
import { ArrowUpRightIcon, CalendarCheck2Icon, SparklesIcon, StarIcon, TrendingUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoLoginButton } from "@/features/auth/components/demo-login-button";
import { siteConfig } from "@/lib/site";
import { ProductMockup } from "./product-mockup";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-14 pb-20 sm:pt-20">
      <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-60" />
      <div className="absolute top-[-14rem] left-1/2 -z-10 h-[42rem] w-[64rem] -translate-x-1/2 bg-[radial-gradient(closest-side,rgb(99_102_241/0.28),rgb(168_85_247/0.16)_45%,rgb(236_72_153/0.06)_70%,transparent)] dark:bg-[radial-gradient(closest-side,rgb(99_102_241/0.32),rgb(168_85_247/0.18)_45%,rgb(236_72_153/0.08)_70%,transparent)]" />

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <Link
          href="/changelog"
          className="group mx-auto inline-flex items-center gap-2 rounded-full border bg-background/70 py-1 pr-3 pl-1 text-xs font-medium shadow-sm backdrop-blur transition-colors hover:bg-background"
        >
          <span className="bg-brand-gradient inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-white">
            <SparklesIcon className="size-3" /> New
          </span>
          Smart waitlist and SMS reminders are live
          <ArrowUpRightIcon className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
          Bookings that <span className="text-gradient">run themselves</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
          FlowDesk gives salons, clinics and consultants a beautiful booking page, a calendar their whole team
          loves, and the client insights to grow — without the admin.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <DemoLoginButton size="lg" className="h-11 w-full px-5 text-[15px] sm:w-auto">
            Try the live demo
          </DemoLoginButton>
          <Button asChild size="lg" variant="outline" className="h-11 w-full px-5 text-[15px] sm:w-auto">
            <Link href={`/book/${siteConfig.demoBookingSlug}`}>
              <CalendarCheck2Icon /> See a booking page
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No sign-up needed. Explore a fully loaded workspace in one click.
        </p>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="glow absolute -inset-x-20 -top-16 -bottom-10 -z-10 opacity-70" />
          <ProductMockup />

          <div className="absolute -top-6 -left-4 hidden animate-float rounded-xl border bg-card/90 p-3 text-left shadow-xl backdrop-blur lg:block">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <TrendingUpIcon className="size-4" />
              </span>
              <div>
                <p className="text-[11px] text-muted-foreground">Revenue this month</p>
                <p className="text-sm font-semibold">
                  $18,420{" "}
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">+24%</span>
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -right-6 bottom-10 hidden animate-float rounded-xl border bg-card/90 p-3 text-left shadow-xl backdrop-blur [animation-delay:1.5s] lg:block">
            <div className="flex items-center gap-2.5">
              <span className="bg-brand-gradient grid size-8 place-items-center rounded-full text-xs font-semibold text-white">
                MR
              </span>
              <div>
                <p className="text-xs font-medium">Mia booked Balayage</p>
                <p className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  Fri, 10:30 AM · <StarIcon className="size-3 fill-amber-400 text-amber-400" /> Returning
                  client
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
