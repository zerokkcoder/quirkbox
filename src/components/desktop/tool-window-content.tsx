"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PixelAvatarTool } from "@/features/pixel-avatar/components/pixel-avatar-tool";
import { RandomNameTool } from "@/features/random-name/components/random-name-tool";
import { getAvatarPalette } from "@/features/pixel-avatar/lib/palettes";
import { createSeed } from "@/features/pixel-avatar/lib/seeds";
import { normalizeNameFilters } from "@/features/random-name/lib/rules";
import type { NameFilters, NameSuggestion } from "@/features/random-name/lib/types";
import type { Messages } from "@/lib/i18n";

export type DesktopToolId = "random-name" | "pixel-avatar";

function WindowPlaceholder() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/**
 * The name generator is seeded on the server so every visit gets a fresh name without
 * shipping all 14 Faker locales to the browser. The window asks the same API the tool
 * itself uses and only mounts the tool once a suggestion is in hand.
 */
function RandomNameWindow({ labels }: { labels: Messages["randomName"] }) {
  const [initial, setInitial] = useState<{ filters: NameFilters; result: NameSuggestion } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async (attemptsLeft: number) => {
      const filters = normalizeNameFilters({});
      const query = new URLSearchParams({
        culture: filters.culture,
        gender: filters.gender,
        seed: filters.seed,
      });

      try {
        const response = await fetch(`/api/random-name?${query.toString()}`);
        if (!response.ok) throw new Error("random-name request failed");

        const payload = (await response.json()) as { result: NameSuggestion };
        if (!cancelled) setInitial({ filters, result: payload.result });
      } catch {
        if (cancelled || attemptsLeft === 0) return;
        timer = window.setTimeout(() => void load(attemptsLeft - 1), 500);
      }
    };

    void load(2);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  if (!initial) return <WindowPlaceholder />;

  return (
    <RandomNameTool
      labels={labels}
      initialFilters={initial.filters}
      initialResult={initial.result}
      syncUrl={false}
    />
  );
}

function PixelAvatarWindow({ labels }: { labels: Messages["pixelAvatar"] }) {
  const [initialState] = useState(() => ({
    seed: createSeed(10),
    palette: getAvatarPalette().id,
    background: "grid",
    size: "256",
  }));

  return <PixelAvatarTool labels={labels} initialState={initialState} syncUrl={false} />;
}

export function ToolWindowContent({ toolId, messages }: { toolId: DesktopToolId; messages: Messages }) {
  if (toolId === "random-name") {
    return <RandomNameWindow labels={messages.randomName} />;
  }

  return <PixelAvatarWindow labels={messages.pixelAvatar} />;
}
