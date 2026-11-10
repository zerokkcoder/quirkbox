import Link from "next/link";
import { LanguagesIcon } from "lucide-react";
import { type Locale } from "@/config/site";
import { localizePath, stripLocalePrefix } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const options = [
  { locale: "en", label: "EN" },
  { locale: "zh-Hant", label: "繁中" },
] as const;

export function LanguageSwitcher({
  locale,
  pathname,
  label,
}: {
  locale: Locale;
  pathname: string;
  label: string;
}) {
  const basePath = stripLocalePrefix(pathname);

  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center gap-0.5 rounded-full border border-border/70 bg-background/70 p-0.5"
    >
      <LanguagesIcon aria-hidden className="mx-1.5 size-3.5 text-muted-foreground" />
      {options.map((option) => {
        const isActive = locale === option.locale;

        return (
          <Link
            key={option.locale}
            href={localizePath(option.locale, basePath)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
