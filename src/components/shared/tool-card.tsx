import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="h-full bg-card/90">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge} variant="secondary">
              {badge}
            </Badge>
          ))}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="rounded-2xl border border-dashed border-border bg-muted/50 p-4 text-sm text-muted-foreground">
          Dedicated tool route, SEO metadata, and shareable state are already wired in.
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" render={<Link href={localizePath(locale, href)} />}>
            <ArrowRightIcon data-icon="inline-end" />
            {actionLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}
