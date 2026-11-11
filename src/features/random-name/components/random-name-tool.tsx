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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackEvent } from "@/lib/analytics";
import { replaceSearchState } from "@/lib/url-state";
import { createSeed } from "@/lib/seeds";
import { cultures, nameGenders, type NameFilters, type NameSuggestion } from "@/features/random-name/lib/types";
import type { Messages } from "@/lib/i18n";

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

function findLocalVoice(voices: SpeechSynthesisVoice[], langCode: string) {
  const target = langCode.replace("_", "-").toLowerCase();

  return (
    voices.find((voice) => voice.lang.replace("_", "-").toLowerCase() === target) ??
    voices.find((voice) => voice.lang.replace("_", "-").toLowerCase().startsWith(target.slice(0, 2)))
  );
}

const onlineTtsEndpoint = "https://translate.google.com/translate_tts";

function onlineSpeechUrl(name: string, langCode: string) {
  const query = new URLSearchParams({ ie: "UTF-8", client: "tw-ob", tl: langCode, q: name });

  return `${onlineTtsEndpoint}?${query.toString()}`;
}

export function RandomNameTool({
  labels,
  initialFilters,
  initialResult,
  syncUrl = true,
}: {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    const synth = getSpeechSynthesis();
    const voice = synth ? findLocalVoice(voices, result.langCode) : undefined;

    if (synth && voice) {
      const utterance = new SpeechSynthesisUtterance(result.fullName);
      utterance.lang = result.langCode;
      utterance.voice = voice;
      synth.cancel();
      synth.speak(utterance);
      return;
    }

    const audio = new Audio(onlineSpeechUrl(result.fullName, result.langCode));
    audioRef.current = audio;
    void audio.play().catch(() => {
      if (audioRef.current === audio) {
        audioRef.current = null;
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
        </CardContent>
      </Card>
    </div>
  );
}
