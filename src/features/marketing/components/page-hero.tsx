export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pt-16 pb-12 sm:pt-24">
      <div className="bg-grid mask-radial absolute inset-0 -z-10 opacity-50" />
      <div className="glow absolute top-[-14rem] left-1/2 -z-10 h-[30rem] w-[44rem] -translate-x-1/2 opacity-60" />
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-sm font-semibold text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-muted-foreground sm:text-lg">{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
