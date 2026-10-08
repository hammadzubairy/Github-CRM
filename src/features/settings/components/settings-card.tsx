import { cn } from "@/lib/utils";

export function SettingsCard({
  title,
  description,
  children,
  footer,
  className,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        tone === "danger" && "border-destructive/30",
        className,
      )}
    >
      <div className="space-y-1 p-5 pb-0 sm:p-6 sm:pb-0">
        <h2 className="font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
      {footer ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-5 py-3 sm:px-6",
            tone === "danger" && "bg-destructive/[0.03]",
          )}
        >
          {footer}
        </div>
      ) : null}
    </section>
  );
}
