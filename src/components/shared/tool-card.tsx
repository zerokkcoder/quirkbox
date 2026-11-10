import type { ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";

export function ToolCard({
  locale,
  icon,
  title,
  href,
}: {
  locale: Locale;
  icon: ReactNode;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={localizePath(locale, href)}
      className="group/card flex flex-col items-center gap-3 rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary transition duration-300 group-hover/card:-translate-y-1 group-hover/card:bg-primary group-hover/card:text-primary-foreground group-hover/card:shadow-[0_18px_40px_-24px_var(--color-primary)] group-active/card:translate-y-0 group-active/card:scale-95 [&_svg]:size-7">
        {icon}
      </span>
      <span className="text-center text-sm font-medium tracking-tight transition-colors duration-300 group-hover/card:text-primary">
        {title}
      </span>
    </Link>
  );
}
