import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

/** Fallback for unmatched unprefixed routes; the proxy handles locale-prefixed ones. */
export default function NotFound() {
  return (
    <main className="page-shell flex flex-1 flex-col items-center justify-center gap-5 py-24 text-center">
      <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
        404 · {siteConfig.name}
      </p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">
        This address isn&apos;t on the map. Head back to the tools.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground mt-2 rounded-xl px-5 py-2.5 text-sm font-medium"
      >
        Back to home
      </Link>
    </main>
  );
}
