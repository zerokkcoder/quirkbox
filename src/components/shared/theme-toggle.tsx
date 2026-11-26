"use client";

import { useEffect, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import {
  applyThemePreference,
  readThemePreference,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const order: ThemePreference[] = ["light", "dark", "system"];

export type ThemeToggleLabels = {
  label: string;
  light: string;
  dark: string;
  system: string;
};

export function ThemeToggle({ labels }: { labels: ThemeToggleLabels }) {
  const [preference, setPreference] = useState<ThemePreference>("light");

  useEffect(() => {
    // Defer so hydration keeps the server-rendered icon until the real choice
    // is read from the document (the inline boot script already applied it).
    queueMicrotask(() => setPreference(readThemePreference()));
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (readThemePreference() === "system") {
        applyThemePreference("system", media.matches);
      }
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  function cycleTheme() {
    // Read the DOM value so a click before the sync effect still advances once.
    const current = readThemePreference();
    const next = order[(order.indexOf(current) + 1) % order.length];
    setPreference(next);
    applyThemePreference(next, window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  const Icon =
    preference === "dark" ? MoonIcon : preference === "system" ? MonitorIcon : SunIcon;
  const name =
    preference === "dark" ? labels.dark : preference === "system" ? labels.system : labels.light;

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={cycleTheme}
      aria-label={`${labels.label}: ${name}`}
      title={`${labels.label}: ${name}`}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70",
        "text-muted-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-muted hover:text-foreground active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      )}
    >
      <Icon aria-hidden className="size-4" />
    </button>
  );
}
