import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)} fill="none">
      <defs>
        <linearGradient id="fd-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#fd-mark)" />
      <path d="M10 11.5h12M10 16h8M10 20.5h5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="22" cy="20.5" r="2.4" fill="white" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      {!compact && <span className="text-[17px]">FlowDesk</span>}
    </span>
  );
}
