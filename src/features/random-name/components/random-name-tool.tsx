"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { RefreshCcwIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { trackEvent } from "@/lib/analytics";
import { replaceSearchState } from "@/lib/url-state";
import { createSeed } from "@/features/pixel-avatar/lib/seeds";
import { cultures, nameGenders, nameVibes, type NameFilters, type NameSuggestion } from "@/features/random-name/lib/types";
import type { Messages } from "@/lib/i18n";

function toApiQuery(filters: NameFilters) {
  return new URLSearchParams({
    culture: filters.culture,
    gender: filters.gender,
    vibe: filters.vibe,
    includeMeaning: String(filters.includeMeaning),
    seed: filters.seed,
  });
}

export function RandomNameTool({
  labels,
  initialFilters,
  initialResult,
}: {
  labels: Messages["randomName"];
  initialFilters: NameFilters;
  initialResult: NameSuggestion;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<NameFilters>(initialFilters);
  const [result, setResult] = useState<NameSuggestion>(initialResult);
  const [isLoading, setIsLoading] = useState(false);

  const genderOptions = useMemo(
    () =>
      nameGenders.map((gender) => ({
        value: gender,
        label: labels[gender],
      })),
    [labels]
  );

  const vibeOptions = useMemo(
    () =>
      nameVibes.map((vibe) => ({
        value: vibe,
        label: labels[vibe],
      })),
    [labels]
  );

  function syncUrl(nextFilters: NameFilters) {
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), {
      culture: nextFilters.culture,
      gender: nextFilters.gender,
      vibe: nextFilters.vibe,
      includeMeaning: nextFilters.includeMeaning ? "true" : undefined,
      seed: nextFilters.seed,
    });
  }

  async function regenerate(nextFilters?: NameFilters) {
    const requestFilters = nextFilters ?? { ...filters, seed: createSeed(8) };
    setIsLoading(true);
    setFilters(requestFilters);
    syncUrl(requestFilters);

    try {
      const response = await fetch(`/api/random-name?${toApiQuery(requestFilters).toString()}`);
      const payload = (await response.json()) as { result: NameSuggestion };
      setResult(payload.result);
      trackEvent({ name: "random_name_generated", metadata: { culture: requestFilters.culture, vibe: requestFilters.vibe } });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="generator" className="flex flex-col gap-6">
      <TabsList>
        <TabsTrigger value="generator">Generator</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      <TabsContent value="generator" className="flex flex-col gap-6">
        <Alert>
          <AlertTitle>{labels.title}</AlertTitle>
          <AlertDescription>{labels.note}</AlertDescription>
        </Alert>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>{labels.title}</CardTitle>
              <CardDescription>{labels.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FieldGroup>
                <Field>
                  <FieldLabel>{labels.culture}</FieldLabel>
                  <Select
                    items={cultures.map((culture) => ({ value: culture, label: culture }))}
                    value={filters.culture}
                    onValueChange={(value) => {
                      const nextFilters = { ...filters, culture: value as NameFilters["culture"] };
                      setFilters(nextFilters);
                      syncUrl(nextFilters);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={labels.culture} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {cultures.map((culture) => (
                          <SelectItem key={culture} value={culture}>
                            {culture}
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
                      const nextFilters = { ...filters, gender: nextValue as NameFilters["gender"] };
                      setFilters(nextFilters);
                      syncUrl(nextFilters);
                    }}
                  >
                    {genderOptions.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>{labels.vibe}</FieldLabel>
                  <ToggleGroup
                    variant="outline"
                    value={[filters.vibe]}
                    onValueChange={(value) => {
                      const nextValue = value[0];
                      if (!nextValue) return;
                      const nextFilters = { ...filters, vibe: nextValue as NameFilters["vibe"] };
                      setFilters(nextFilters);
                      syncUrl(nextFilters);
                    }}
                  >
                    {vibeOptions.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value}>
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                <Field>
                  <FieldLabel>{labels.seed}</FieldLabel>
                  <Input
                    value={filters.seed}
                    onChange={(event) => {
                      const nextFilters = { ...filters, seed: event.target.value };
                      setFilters(nextFilters);
                      syncUrl(nextFilters);
                    }}
                  />
                  <FieldDescription>
                    Share this seed if you want someone else to revisit the same suggestion.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>{labels.meaning}</FieldLabel>
                  <ToggleGroup
                    variant="outline"
                    value={[String(filters.includeMeaning)]}
                    onValueChange={(value) => {
                      const includeMeaning = value[0] === "true";
                      const nextFilters = { ...filters, includeMeaning };
                      setFilters(nextFilters);
                      syncUrl(nextFilters);
                    }}
                  >
                    <ToggleGroupItem value="true">On</ToggleGroupItem>
                    <ToggleGroupItem value="false">Off</ToggleGroupItem>
                  </ToggleGroup>
                </Field>
              </FieldGroup>

              <Button onClick={() => void regenerate()} disabled={isLoading}>
                <RefreshCcwIcon data-icon="inline-start" />
                {isLoading ? "Generating..." : labels.generate}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{labels.result}</CardTitle>
              <CardDescription>{result.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{result.culture}</Badge>
                <Badge variant="secondary">{labels[result.vibe]}</Badge>
                <Badge variant="secondary">{labels[result.gender]}</Badge>
              </div>
              <div className="rounded-2xl border border-border bg-muted/50 p-5">
                <p className="text-4xl font-semibold tracking-tight">{result.name}</p>
              </div>
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="font-medium">{labels.pronunciation}</p>
                  <p className="text-muted-foreground">{result.pronunciation}</p>
                </div>
                {result.meaning ? (
                  <div>
                    <p className="font-medium">{labels.meaningLabel}</p>
                    <p className="text-muted-foreground">{result.meaning}</p>
                  </div>
                ) : null}
                <div>
                  <p className="font-medium">{labels.whyItFits}</p>
                  <p className="text-muted-foreground">{result.reason}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="notes">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
            <CardDescription>QuirkBox keeps the first version deterministic and fast.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>The generator picks from curated culture-specific name libraries.</p>
            <p>Gender leaning and vibe act like filters plus weighting, while the seed makes the result shareable.</p>
            <p>That keeps the output stable without sending any data to external AI services.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
