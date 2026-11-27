import type { ReactNode } from "react";
import {
  BarChart3Icon,
  BlendIcon,
  BracesIcon,
  BriefcaseBusinessIcon,
  ClockIcon,
  Code2Icon,
  DicesIcon,
  GraduationCapIcon,
  Grid2x2Icon,
  HeartPulseIcon,
  ImageIcon,
  MapPinnedIcon,
  MegaphoneIcon,
  PaletteIcon,
  PenLineIcon,
  QrCodeIcon,
  ShoppingBagIcon,
  SmileIcon,
  WalletIcon,
} from "lucide-react";
import { SiteShell } from "@/components/shared/site-shell";
import { ToolCard } from "@/components/shared/tool-card";
import { PageHeader } from "@/components/shared/page-header";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

type CategoryTool = {
  title: string;
  href: string;
  icon: ReactNode;
};

export function ToolsPage({
  locale,
  messages,
}: {
  locale: Locale;
  messages: Messages;
}) {
  const categories: {
    id: keyof Messages["tools"]["categories"];
    icon: ReactNode;
    tools: CategoryTool[];
  }[] = [
    {
      id: "design",
      icon: <PaletteIcon />,
      tools: [
        {
          title: messages.tools.paletteStudio.title,
          href: "/tools/color-palette-generator",
          icon: <PaletteIcon />,
        },
        {
          title: messages.tools.pixelAvatar.title,
          href: "/tools/pixel-avatar",
          icon: <Grid2x2Icon />,
        },
        {
          title: messages.tools.emojiWallpaper.title,
          href: "/tools/emoji-wallpaper",
          icon: <SmileIcon />,
        },
        {
          title: messages.tools.imageStudio.title,
          href: "/tools/image-converter",
          icon: <ImageIcon />,
        },
        {
          title: messages.tools.gradientWallpaper.title,
          href: "/tools/gradient-wallpaper-generator",
          icon: <BlendIcon />,
        },
      ],
    },
    {
      id: "marketing",
      icon: <MegaphoneIcon />,
      tools: [
        {
          title: messages.tools.qrCodeGenerator.title,
          href: "/tools/qr-code-generator",
          icon: <QrCodeIcon />,
        },
      ],
    },
    {
      id: "content",
      icon: <PenLineIcon />,
      tools: [
        {
          title: messages.tools.randomName.title,
          href: "/tools/random-name",
          icon: <DicesIcon />,
        },
        {
          title: messages.tools.asciiArt.title,
          href: "/tools/ascii-art-generator",
          icon: <BracesIcon />,
        },
      ],
    },
    {
      id: "travel",
      icon: <MapPinnedIcon />,
      tools: [
        {
          title: messages.tools.travelFootprint.title,
          href: "/tools/travel-footprint",
          icon: <MapPinnedIcon />,
        },
      ],
    },
    { id: "development", icon: <Code2Icon />, tools: [] },
    { id: "ecommerce", icon: <ShoppingBagIcon />, tools: [] },
    { id: "education", icon: <GraduationCapIcon />, tools: [] },
    { id: "finance", icon: <WalletIcon />, tools: [] },
    { id: "data", icon: <BarChart3Icon />, tools: [] },
    { id: "office", icon: <BriefcaseBusinessIcon />, tools: [] },
    { id: "hr", icon: <PenLineIcon />, tools: [] },
    { id: "healthcare", icon: <HeartPulseIcon />, tools: [] },
  ];

  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/tools")}>
      <div className="flex flex-col gap-10">
        <PageHeader
          eyebrow={messages.nav.tools}
          title={messages.tools.title}
          description={messages.tools.description}
        />
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{messages.tools.note}</p>
        <nav aria-label={messages.tools.categoriesLabel} className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="rounded-full border border-border/70 bg-background px-3.5 py-1.5 text-xs font-medium tracking-tight text-muted-foreground transition-[border-color,color,transform] duration-150 ease-[var(--ease-out)] hover:border-primary/40 hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.97]"
            >
              {messages.tools.categories[category.id].title}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-14">
          {categories.map((category) => {
            const copy = messages.tools.categories[category.id];
            return (
              <section
                key={category.id}
                id={`category-${category.id}`}
                className="flex scroll-mt-24 flex-col gap-6 border-t border-border/60 pt-10 first:border-0 first:pt-0"
              >
                <header className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
                    {category.icon}
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-heading text-xl font-semibold tracking-tight">{copy.title}</h2>
                    <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-xs font-medium tracking-wide text-muted-foreground">
                    {category.tools.length > 0
                      ? `${category.tools.length} ${messages.nav.tools.toLowerCase()}`
                      : messages.tools.comingSoon}
                  </span>
                </header>
                {category.tools.length > 0 ? (
                  <div className="reveal grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                    {category.tools.map((tool) => (
                      <ToolCard
                        key={tool.href}
                        locale={locale}
                        icon={tool.icon}
                        title={tool.title}
                        href={tool.href}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-24 items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/30 px-5 py-4 text-sm text-muted-foreground">
                    <ClockIcon className="size-5 shrink-0" />
                    <span>{messages.tools.comingSoon}</span>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </SiteShell>
  );
}
