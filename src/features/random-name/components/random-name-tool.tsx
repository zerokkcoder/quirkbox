"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { RefreshCcwIcon, Volume2Icon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackEvent } from "@/lib/analytics";
import { replaceSearchState } from "@/lib/url-state";
import { createSeed } from "@/lib/seeds";
import { cultures, nameGenders, type NameFilters, type NameSuggestion } from "@/features/random-name/lib/types";
import { fallbackAudioUrl, findVoice } from "@/features/random-name/lib/speech";
import { getMessages, type Messages } from "@/lib/i18n";
import { localizePath } from "@/i18n/navigation";
import { siteConfig, type Locale } from "@/config/site";

function toApiQuery(filters: NameFilters) {
  return new URLSearchParams({
    culture: filters.culture,
    gender: filters.gender,
    seed: filters.seed,
  });
}

function getSpeechSynthesis() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis;
}

export function RandomNameTool({
  locale,
  labels,
  initialFilters,
  initialResult,
  syncUrl = true,
}: {
  locale: Locale;
  labels: Messages["randomName"];
  initialFilters: NameFilters;
  initialResult: NameSuggestion;
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NameFilters>(initialFilters);
  const [result, setResult] = useState<NameSuggestion>(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pronunciationError, setPronunciationError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const shareLabels = getMessages(locale).share;
  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/random-name")}`;

  useEffect(() => {
    const synth = getSpeechSynthesis();
    if (!synth) return;

    const sync = () => setVoices(synth.getVoices());
    sync();
    synth.addEventListener("voiceschanged", sync);

    return () => {
      synth.removeEventListener("voiceschanged", sync);
      synth.cancel();
      audioRef.current?.pause();
    };
  }, []);

  const genderOptions = useMemo(
    () => nameGenders.map((gender) => ({ value: gender, label: labels[gender] })),
    [labels]
  );

  async function requestSuggestion(nextFilters: NameFilters) {
    setIsLoading(true);
    setFilters(nextFilters);
    if (syncUrl) {
      replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), {
        culture: nextFilters.culture,
        gender: nextFilters.gender,
      });
    }

    try {
      const response = await fetch(`/api/random-name?${toApiQuery(nextFilters).toString()}`);
      const payload = (await response.json()) as { result: NameSuggestion };
      setResult(payload.result);
      trackEvent({ name: "random_name_generated", metadata: { culture: nextFilters.culture } });
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilters(patch: Partial<NameFilters>) {
    void requestSuggestion({ ...filters, ...patch, seed: createSeed(8) });
  }

  function shuffle() {
    void requestSuggestion({ ...filters, seed: createSeed(8) });
  }

  function playPronunciation() {
    audioRef.current?.pause();
    audioRef.current = null;
    setPronunciationError(false);

    const synth = getSpeechSynthesis();
    if (synth) {
      // Prefer a voice matching the name's language, but still speak without
      // one: the browser falls back to its default voice, which is audible
      // even when only a different language's voice pack is installed.
      const voice = findVoice(voices, result.langCode);
      const utterance = new SpeechSynthesisUtterance(result.fullName);
      utterance.lang = result.langCode;
      if (voice) utterance.voice = voice;
      utterance.onerror = () => setPronunciationError(true);
      synth.cancel();
      synth.resume();
      synth.speak(utterance);
      return;
    }

    // SpeechSynthesis is missing entirely — last resort is remote audio.
    const audio = new Audio(fallbackAudioUrl(result.fullName));
    audioRef.current = audio;
    void audio.play().catch(() => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        setPronunciationError(true);
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr] @2xl:grid-cols-[1fr_0.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>{labels.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>{labels.culture}</FieldLabel>
              <Select
                items={cultures.map((culture) => ({ value: culture, label: labels.cultures[culture] }))}
                value={filters.culture}
                onValueChange={(value) => updateFilters({ culture: value as NameFilters["culture"] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={labels.culture} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {cultures.map((culture) => (
                      <SelectItem key={culture} value={culture}>
                        {labels.cultures[culture]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>{labels.gender}</FieldLabel>
              <ToggleGroup
                variant="outline"
                value={[filters.gender]}
                onValueChange={(value) => {
                  const nextValue = value[0];
                  if (!nextValue) return;
                  updateFilters({ gender: nextValue as NameFilters["gender"] });
                }}
              >
                {genderOptions.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.result}</CardTitle>
          <CardAction>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shuffle}
                disabled={isLoading}
                title={labels.shuffle}
              >
                <RefreshCcwIcon data-icon="inline-start" />
                {isLoading ? labels.generating : labels.shuffle}
              </Button>
              <ShareToXButton
                labels={shareLabels}
                tool="random-name"
                size="sm"
                title={labels.title}
                description={labels.description}
                url={shareUrl}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{labels.cultures[result.culture]}</Badge>
            <Badge variant="secondary">{labels[result.gender]}</Badge>
          </div>
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/50 p-5 transition-opacity",
              isLoading && "opacity-50"
            )}
          >
            <p className="min-w-0 wrap-break-word text-4xl font-semibold tracking-tight">{result.fullName}</p>
            <Button
              variant="outline"
              size="icon"
              onClick={playPronunciation}
              title={labels.listen}
              aria-label={labels.listen}
            >
              <Volume2Icon />
            </Button>
          </div>
          {pronunciationError ? (
            <p data-testid="pronunciation-error" role="status" className="text-sm text-destructive">
              {labels.pronunciationFailed}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
