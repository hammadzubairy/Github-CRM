import Link from "next/link";
import { StarIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="FlowDesk home" className="rounded-md">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-center text-xs text-muted-foreground">
          Demo project by Ahmad Khajeh —{" "}
          <a href="https://ahmadkhajeh.com" className="underline-offset-4 hover:underline">
            ahmadkhajeh.com
          </a>
        </p>
      </div>
      <aside className="relative hidden overflow-hidden bg-zinc-950 lg:block" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_70%_10%,rgba(99,102,241,0.55),transparent_70%),radial-gradient(60%_50%_at_10%_90%,rgba(168,85,247,0.4),transparent_70%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px] opacity-[0.12]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <div className="mb-10 grid max-w-md gap-3">
            {[
              ["Mia R.", "Balayage", "Fri · 10:30 AM", "bg-violet-400"],
              ["Leo M.", "Men's Cut", "Fri · 12:00 PM", "bg-sky-400"],
              ["Grace K.", "Root Color", "Fri · 2:15 PM", "bg-pink-400"],
            ].map(([name, service, time, color], i) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                style={{ marginLeft: i * 24 }}
              >
                <span className={`h-9 w-1 rounded-full ${color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{service}</p>
                  <p className="text-xs text-white/60">
                    {name} · {time}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} className="size-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <blockquote className="mt-4 max-w-md text-xl leading-relaxed font-medium text-balance">
            “FlowDesk filled our Tuesday gaps within a month. It is the calmest our front desk has ever been.”
          </blockquote>
          <p className="mt-4 text-sm text-white/60">Camila Rossi · Owner, Atelier Nord</p>
        </div>
      </aside>
      <Toaster />
    </div>
  );
}
