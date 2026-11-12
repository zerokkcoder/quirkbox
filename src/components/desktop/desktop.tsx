"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Link from "next/link";
import { DicesIcon, Grid2x2Icon, LayoutGridIcon, MapPinnedIcon, SmileIcon, SparklesIcon } from "lucide-react";
import { MacWindow, type MacWindowBounds } from "@/components/desktop/mac-window";
import { ToolWindowContent, type DesktopToolId } from "@/components/desktop/tool-window-content";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { siteConfig, type Locale } from "@/config/site";
import { localizePath } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Messages } from "@/lib/i18n";

type DesktopApp = {
  id: DesktopToolId;
  icon: ComponentType<{ className?: string }>;
  accent: string;
};

const desktopApps: DesktopApp[] = [
  { id: "random-name", icon: DicesIcon, accent: "from-chart-1 to-chart-4" },
  { id: "pixel-avatar", icon: Grid2x2Icon, accent: "from-chart-3 to-chart-2" },
  { id: "emoji-wallpaper", icon: SmileIcon, accent: "from-chart-5 to-chart-1" },
  { id: "travel-footprint", icon: MapPinnedIcon, accent: "from-chart-2 to-chart-3" },
];

const appTile = "flex items-center justify-center bg-gradient-to-br shadow-lg ring-1 ring-black/20 transition duration-300";

type WindowInstance = MacWindowBounds & {
  id: DesktopToolId;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

export function Desktop({ locale, messages }: { locale: Locale; messages: Messages }) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const format = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const tick = () => setClock(format.format(new Date()));

    tick();
    const timer = window.setInterval(tick, 15_000);

    return () => window.clearInterval(timer);
  }, [locale]);

  const toolNames: Record<DesktopToolId, string> = {
    "random-name": messages.tools.randomName.title,
    "pixel-avatar": messages.tools.pixelAvatar.title,
    "emoji-wallpaper": messages.tools.emojiWallpaper.title,
    "travel-footprint": messages.tools.travelFootprint.title,
  };

  function toolName(toolId: DesktopToolId) {
    return toolNames[toolId];
  }

  function defaultBounds(index: number): MacWindowBounds {
    const rect = layerRef.current?.getBoundingClientRect();
    const available = { width: rect?.width ?? window.innerWidth, height: rect?.height ?? window.innerHeight };
    const width = Math.min(920, Math.max(320, available.width - 64));
    const height = Math.min(680, Math.max(260, available.height - 24));
    const step = 28 * (index % 5);

    return {
      x: Math.max(0, Math.min(40 + step, available.width - width - 16)),
      y: Math.max(0, Math.min(32 + step, available.height - height - 16)),
      width,
      height,
    };
  }

  function openWindow(toolId: DesktopToolId) {
    setWindows((current) => {
      const topZ = current.reduce((max, item) => Math.max(max, item.zIndex), 0);

      if (current.some((item) => item.id === toolId)) {
        return current.map((item) =>
          item.id === toolId ? { ...item, minimized: false, zIndex: topZ + 1 } : item
        );
      }

      const bounds = defaultBounds(current.length);

      return [...current, { id: toolId, ...bounds, zIndex: topZ + 1, minimized: false, maximized: false }];
    });
  }

  function focusWindow(toolId: DesktopToolId) {
    setWindows((current) => {
      const top = current.find((item) => item.id === toolId);
      const topZ = current.reduce((max, item) => Math.max(max, item.zIndex), 0);
      if (!top || top.zIndex === topZ) return current;

      return current.map((item) => (item.id === toolId ? { ...item, zIndex: topZ + 1 } : item));
    });
  }

  function closeWindow(toolId: DesktopToolId) {
    setWindows((current) => current.filter((item) => item.id !== toolId));
  }

  function minimizeWindow(toolId: DesktopToolId) {
    setWindows((current) => current.map((item) => (item.id === toolId ? { ...item, minimized: true } : item)));
  }

  function toggleMaximizeWindow(toolId: DesktopToolId) {
    setWindows((current) =>
      current.map((item) =>
        item.id === toolId ? { ...item, minimized: false, maximized: !item.maximized } : item
      )
    );
  }

  function updateWindowBounds(toolId: DesktopToolId, next: Partial<MacWindowBounds>) {
    setWindows((current) => current.map((item) => (item.id === toolId ? { ...item, ...next } : item)));
  }

  const visible = windows.filter((item) => !item.minimized);
  const activeId =
    visible.length === 0 ? null : visible.reduce((top, item) => (item.zIndex > top.zIndex ? item : top)).id;

  return (
    <div className="dark desktop-wallpaper fixed inset-0 overflow-hidden text-foreground">
      <div className="absolute inset-x-0 top-0 flex h-9 items-center gap-4 border-b border-border/40 bg-background/50 px-3 backdrop-blur-2xl">
        <Link href={localizePath(locale, "/")} className="flex items-center gap-2">
          <SparklesIcon className="size-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight">{siteConfig.name}</span>
        </Link>

        <nav aria-label={messages.desktop.label} className="flex items-center gap-1 text-sm">
          {[
            { href: "/tools", label: messages.nav.tools },
            { href: "/about", label: messages.nav.about },
          ].map((item) => (
            <Link
              key={item.href}
              href={localizePath(locale, item.href)}
              className="rounded-md px-2 py-1 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3">
          <LanguageSwitcher locale={locale} pathname={localizePath(locale, "/")} label={messages.nav.language} />
          <span className="hidden text-xs font-medium tabular-nums text-muted-foreground sm:inline">{clock}</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-9 bottom-24 grid grid-cols-2 content-start gap-2 p-4 sm:max-w-sm">
        {desktopApps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => openWindow(app.id)}
            className="group pointer-events-auto flex flex-col items-center gap-2 rounded-xl p-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <span className={cn(appTile, app.accent, "size-14 rounded-[1.15rem] group-hover:-translate-y-0.5 group-hover:scale-105")}>
              <app.icon className="size-7 text-white drop-shadow-sm" />
            </span>
            <span className="desktop-icon-label text-center text-xs font-medium leading-tight">
              {toolName(app.id)}
            </span>
          </button>
        ))}
      </div>

      <div ref={layerRef} className="pointer-events-none absolute inset-x-0 top-9 bottom-24 overflow-hidden">
        {windows.map((item) => {
          const app = desktopApps.find((entry) => entry.id === item.id);

          if (!app) return null;

          return (
            <MacWindow
              key={item.id}
              title={toolName(item.id)}
              icon={<app.icon />}
              bounds={{ x: item.x, y: item.y, width: item.width, height: item.height }}
              zIndex={item.zIndex}
              active={activeId === item.id}
              minimized={item.minimized}
              maximized={item.maximized}
              labels={messages.desktop}
              onFocus={() => focusWindow(item.id)}
              onBoundsChange={(next) => updateWindowBounds(item.id, next)}
              onMinimize={() => minimizeWindow(item.id)}
              onToggleMaximize={() => toggleMaximizeWindow(item.id)}
              onClose={() => closeWindow(item.id)}
            >
              <ToolWindowContent toolId={item.id} locale={locale} messages={messages} />
            </MacWindow>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
        <div
          role="toolbar"
          aria-label={messages.desktop.dock}
          className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/40 bg-background/40 px-3 py-2 shadow-2xl backdrop-blur-2xl"
        >
          {desktopApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => openWindow(app.id)}
              aria-label={toolName(app.id)}
              className="group flex flex-col items-center gap-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
            >
              <span className={cn(appTile, app.accent, "size-11 rounded-xl group-hover:-translate-y-1.5 group-hover:scale-110")}>
                <app.icon className="size-5 text-white drop-shadow-sm" />
              </span>
              <span
                aria-hidden
                className={cn(
                  "size-1 rounded-full bg-foreground/60 transition-opacity",
                  windows.some((item) => item.id === app.id) ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          ))}

          <span aria-hidden className="h-9 w-px bg-border/60" />

          <Link
            href={localizePath(locale, "/tools")}
            aria-label={messages.nav.tools}
            className="group flex flex-col items-center gap-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
          >
            <span className={cn(appTile, "from-chart-4 to-chart-5 size-11 rounded-xl group-hover:-translate-y-1.5 group-hover:scale-110")}>
              <LayoutGridIcon className="size-5 text-white drop-shadow-sm" />
            </span>
            <span aria-hidden className="size-1 opacity-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
