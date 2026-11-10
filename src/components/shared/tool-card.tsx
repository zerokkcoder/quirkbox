import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";

export function ToolCard({
  locale,
  title,
  description,
  href,
  badges,
  actionLabel,
}: {
  locale: Locale;
  title: string;
  description: string;
  href: string;
  badges: string[];
  actionLabel: string;
}) {
  return (
    <Link
      href={localizePath(locale, href)}
      className="group/card flex h-full flex-col gap-5 rounded-xl border border-border/70 bg-card p-6 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_28px_60px_-46px_var(--color-primary)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <Badge key={badge} variant="secondary">
            {badge}
          </Badge>
        ))}
      </span>
      <h3 className="font-heading text-xl font-semibold tracking-tight">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-medium text-primary">
        {actionLabel}
        <ArrowRightIcon className="size-4 transition-transform duration-300 group-hover/card:translate-x-1" />
      </span>
    </Link>
  );
}
