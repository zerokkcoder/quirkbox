export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="stagger flex max-w-3xl flex-col gap-4">
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-primary uppercase">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {eyebrow}
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
