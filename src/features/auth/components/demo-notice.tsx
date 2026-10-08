import { InfoIcon } from "lucide-react";

export function DemoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
      <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="relative my-6 text-center text-xs text-muted-foreground uppercase">
      <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      <span className="relative bg-background px-2">{label}</span>
    </div>
  );
}
