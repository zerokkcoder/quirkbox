import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BlendIcon,
  DicesIcon,
  Grid2x2Icon,
  HeartIcon,
  ImageIcon,
  Link2Icon,
  MapPinnedIcon,
  MegaphoneIcon,
  PaletteIcon,
  PenLineIcon,
  PlusIcon,
  QrCodeIcon,
  SmileIcon,
  ZapIcon,
} from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { SiteShell } from "@/components/shared/site-shell";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import type { Messages } from "@/lib/i18n";

type Labels = Messages["home"];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="flex max-w-2xl flex-col gap-3">
      <p className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-primary uppercase">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {eyebrow}
      </p>
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="text-base leading-7 text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}

function FocusTile({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3.5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium tracking-tight">{title}</p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function HomePage({ locale, messages }: { locale: Locale; messages: Messages }) {
  const labels: Labels = messages.home;
  const tools: {
    href: string;
    icon: ReactNode;
    title: string;
    description: string;
  }[] = [
    {
      href: "/tools/random-name",
      icon: <DicesIcon />,
      title: messages.tools.randomName.title,
      description: labels.tools.randomName,
    },
    {
      href: "/tools/pixel-avatar",
      icon: <Grid2x2Icon />,
      title: messages.tools.pixelAvatar.title,
      description: labels.tools.pixelAvatar,
    },
    {
      href: "/tools/emoji-wallpaper",
      icon: <SmileIcon />,
      title: messages.tools.emojiWallpaper.title,
      description: labels.tools.emojiWallpaper,
    },
    {
      href: "/tools/travel-footprint",
      icon: <MapPinnedIcon />,
      title: messages.tools.travelFootprint.title,
      description: labels.tools.travelFootprint,
    },
    {
      href: "/tools/color-palette-generator",
      icon: <PaletteIcon />,
      title: messages.tools.paletteStudio.title,
      description: labels.tools.paletteStudio,
    },
    {
      href: "/tools/image-converter",
      icon: <ImageIcon />,
      title: messages.tools.imageStudio.title,
      description: labels.tools.imageStudio,
    },
    {
      href: "/tools/qr-code-generator",
      icon: <QrCodeIcon />,
      title: messages.tools.qrCodeGenerator.title,
      description: labels.tools.qrCodeGenerator,
    },
    {
      href: "/tools/gradient-wallpaper-generator",
      icon: <BlendIcon />,
      title: messages.tools.gradientWallpaper.title,
      description: labels.tools.gradientWallpaper,
    },
  ];
  const focusTiles = [
    {
      key: "design",
      icon: <PaletteIcon />,
      title: labels.preview.focus[0].title,
      description: labels.preview.focus[0].description,
    },
    {
      key: "marketing",
      icon: <MegaphoneIcon />,
      title: labels.preview.focus[1].title,
      description: labels.preview.focus[1].description,
    },
    {
      key: "content",
      icon: <PenLineIcon />,
      title: labels.preview.focus[2].title,
      description: labels.preview.focus[2].description,
    },
    {
      key: "travel",
      icon: <MapPinnedIcon />,
      title: labels.preview.focus[3].title,
      description: labels.preview.focus[3].description,
    },
  ];
  const featureIcons = [<ZapIcon key="zap" />, <Link2Icon key="link" />, <HeartIcon key="heart" />];
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: labels.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <SiteShell locale={locale} messages={messages} pathname={localizePath(locale, "/")}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="flex flex-col gap-20 pb-6 sm:gap-28">
        <section className="stagger grid items-center gap-12 py-8 sm:py-14 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
              <BrandMark size={14} />
              {labels.badge}
            </span>
            <h1 className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              {labels.title}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              {labels.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={localizePath(locale, "/tools")}
                className={buttonVariants({ size: "lg", className: "h-11 gap-2 px-5" })}
              >
                {labels.primaryCta}
                <ArrowRightIcon />
              </Link>
              <Link
                href={localizePath(locale, "/about")}
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "h-11 px-5",
                })}
              >
                {labels.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-5 -z-10 rounded-[3rem] bg-primary/8 blur-3xl"
            />
            <div className="rounded-[2rem] border border-border/70 bg-card/80 p-5 shadow-[0_30px_70px_-50px_var(--color-primary)] backdrop-blur-sm sm:p-6">
              <div className="flex items-center justify-between gap-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                <span>{labels.preview.label}</span>
                <span aria-hidden className="flex gap-1.5">
                  <span className="size-2 rounded-full bg-primary/60" />
                  <span className="size-2 rounded-full bg-primary/30" />
                  <span className="size-2 rounded-full bg-primary/15" />
                </span>
              </div>
              <div className="mt-5 flex flex-col gap-3">
                {focusTiles.map((tile) => (
                  <FocusTile
                    key={tile.key}
                    icon={tile.icon}
                    title={tile.title}
                    description={tile.description}
                  />
                ))}
              </div>
              <p className="mt-4 text-center text-xs tracking-wide text-muted-foreground">
                {labels.preview.footnote}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-10 border-t border-border/60 pt-16">
          <SectionHeading
            eyebrow={labels.tools.eyebrow}
            title={labels.tools.title}
            description={labels.tools.description}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={localizePath(locale, tool.href)}
                className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_50px_-40px_var(--color-primary)] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground [&_svg]:size-5">
                  {tool.icon}
                </span>
                <h3 className="mt-5 font-heading text-base font-semibold tracking-tight">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{tool.description}</p>
                <span className="mt-auto flex items-center pt-5 text-xs font-medium text-primary">
                  <ArrowUpRightIcon className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-10 rounded-3xl border border-border/70 bg-muted/40 p-8 sm:p-12 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={labels.features.eyebrow} title={labels.features.title} />
          <div className="grid gap-8 sm:grid-cols-3">
            {labels.features.items.map((item, index) => (
              <div key={item.title} className="flex flex-col gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-background text-primary shadow-sm [&_svg]:size-5">
                  {featureIcons[index]}
                </span>
                <h3 className="font-heading text-sm font-semibold tracking-tight">{item.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow={labels.faq.eyebrow} title={labels.faq.title} />
          <div className="divide-y divide-border rounded-2xl border border-border/70 bg-card">
            {labels.faq.items.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-medium tracking-tight marker:content-none">
                  <h3 className="font-medium">{item.question}</h3>
                  <PlusIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:py-16">
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {labels.cta.title}
          </h2>
          <p className="max-w-lg text-sm leading-7 text-primary-foreground/80">
            {labels.cta.description}
          </p>
          <Link
            href={localizePath(locale, "/tools")}
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "mt-2 h-11 gap-2 px-5",
            })}
          >
            {labels.cta.button}
            <ArrowRightIcon />
          </Link>
        </section>
      </div>
    </SiteShell>
  );
}
