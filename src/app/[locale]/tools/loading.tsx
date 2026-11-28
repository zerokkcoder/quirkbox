/** Instant navigation fallback for the localized tool routes. */
export default function Loading() {
  return (
    <main className="page-shell py-10 sm:py-14">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-2/3 max-w-lg animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-full max-w-2xl animate-pulse rounded-lg bg-muted/70" />
        </div>
        <div className="h-24 w-full animate-pulse rounded-2xl bg-muted/60" />
        <div className="h-80 w-full animate-pulse rounded-2xl bg-muted/40" />
      </div>
    </main>
  );
}
