import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DemoLoginButton } from "@/features/auth/components/demo-login-button";

export function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border bg-zinc-950 px-6 py-16 text-center text-white sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(99,102,241,0.45),transparent_70%)]" />
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)] [background-size:48px_48px] opacity-[0.15]" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Your next client is trying to book right now
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-300">
            Give them a booking experience they will remember — and give yourself your evenings back.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <DemoLoginButton size="lg" className="h-11 bg-white px-5 text-zinc-950 hover:bg-zinc-200">
              Explore the demo
            </DemoLoginButton>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-11 px-5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/signup">Create a free account</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
