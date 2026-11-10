import Link from "next/link";
import { LanguagesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Locale } from "@/config/site";
import { localizePath, stripLocalePrefix } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <LanguagesIcon />
        {label}
      </Badge>
      <div className="flex items-center gap-1 rounded-full border border-border bg-background/80 p-1">
        <Link
          href={localizePath("en", basePath)}
          className={cn(
            "rounded-full px-3 py-1 text-sm",
            locale === "en"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          EN
        </Link>
        <Link
          href={localizePath("zh-Hant", basePath)}
          className={cn(
            "rounded-full px-3 py-1 text-sm",
            locale === "zh-Hant"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          繁中
        </Link>
      </div>
    </div>
  );
}
