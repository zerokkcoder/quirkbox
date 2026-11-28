"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDownIcon,
  CopyIcon,
  RefreshCwIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { ShareToXButton } from "@/components/shared/share-to-x-button";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { siteConfig, type Locale } from "@/config/site";
import { estimateEntropy, shouldShowWeakHint } from "@/features/password-generator/lib/entropy";
import {
  EmptyCharsetError,
  generateBatch,
  loadWordlist,
} from "@/features/password-generator/lib/generator";
import { stateToParams } from "@/features/password-generator/lib/settings";
import {
  applyPreset,
  batchRange,
  lengthRange,
  maxMinPerType,
  selectablePresetIds,
  separatorIds,
  wordCountRange,
  type GeneratorState,
  type SelectablePresetId,
} from "@/features/password-generator/lib/types";
import { localizePath } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import type { Messages } from "@/lib/i18n";
import { replaceSearchState } from "@/lib/url-state";

const typeIds = ["uppercase", "lowercase", "digits", "symbols"] as const;
type TypeId = (typeof typeIds)[number];

const minPerTypeOptions = Array.from({ length: maxMinPerType + 1 }, (_, index) => index);

const feedbackDurationMs = 2600;

async function attemptGeneration(state: GeneratorState): Promise<{
  secrets: string[];
  charsetEmpty: boolean;
}> {
  if (state.mode === "passphrase") await loadWordlist();
  try {
    return { secrets: generateBatch(state), charsetEmpty: false };
  } catch (error) {
    return { secrets: [], charsetEmpty: error instanceof EmptyCharsetError };
  }
}

export function PasswordGeneratorTool({
  locale,
  labels,
  shareLabels,
  initialState,
}: {
  locale: Locale;
  labels: Messages["passwordGenerator"];
  shareLabels: Messages["share"];
  initialState: GeneratorState;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<GeneratorState>(initialState);
  const [secrets, setSecrets] = useState<string[] | null>(null);
  const [charsetEmpty, setCharsetEmpty] = useState(false);
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number | null>(null);

  const shareUrl = `${siteConfig.url}${localizePath(locale, "/tools/password-generator")}`;
  const entropy = useMemo(() => estimateEntropy(state), [state]);
  const weak = useMemo(() => shouldShowWeakHint(state), [state]);

  /**
   * Generated in an effect, never during render: the server and the client each
   * hold a different CSPRNG, so rendering a secret on both sides would cause a
   * hydration mismatch.
   */
  // Hydration constraint: only the client owns a CSPRNG, so the secret cannot
  // be generated during render or on the server.
  useEffect(() => {
    let active = true;
    void attemptGeneration(state).then(({ secrets: next, charsetEmpty: empty }) => {
      if (!active) return;
      setSecrets(next);
      setCharsetEmpty(empty);
    });
    return () => {
      active = false;
    };
  }, [state]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function showFeedback(message: string) {
    setFeedback(message);
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setFeedback("");
      timerRef.current = null;
    }, feedbackDurationMs);
  }

  function syncUrl(next: GeneratorState) {
    replaceSearchState(pathname, new URLSearchParams(searchParams.toString()), stateToParams(next));
  }

  /** Touching a scenario parameter drops the preset highlight; batch size does not. */
  function updateState(patch: Partial<GeneratorState>) {
    const touchesScenario = Object.keys(patch).some((key) => key !== "batch");
    const next: GeneratorState = {
      ...state,
      ...patch,
      preset: touchesScenario ? "custom" : state.preset,
    };

    setState(next);
    syncUrl(next);
  }

  function selectPreset(preset: SelectablePresetId) {
    const next = applyPreset(state, preset);
    setState(next);
    syncUrl(next);
    trackEvent({ name: "password_preset", metadata: { preset } });
  }

  async function regenerate() {
    const { secrets: next, charsetEmpty: empty } = await attemptGeneration(state);
    setSecrets(next);
    setCharsetEmpty(empty);
    trackEvent({ name: "password_regenerated", metadata: { preset: state.preset } });
  }

  async function copySecret(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback(labels.copied);
      // Metadata is settings only — never the secret itself (ADR-0001).
      trackEvent({ name: "password_copied", metadata: { preset: state.preset } });
    } catch {
      showFeedback(labels.copyFailed);
    }
  }

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-card/40 p-4 sm:p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {labels.resultLabel}
          </p>
          <Button variant="outline" size="sm" onClick={regenerate} data-testid="pw-regenerate">
            <RefreshCwIcon data-icon="inline-start" />
            {labels.regenerate}
          </Button>
        </div>

        {secrets === null ? (
          <div
            className="h-10 w-full animate-pulse rounded-lg bg-muted/60"
            data-testid="pw-loading"
          />
        ) : secrets.length === 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="pw-empty">
            {charsetEmpty ? labels.emptyCharset : labels.generateFailed}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {secrets.map((secret, index) => (
              <li key={`${index}-${secret}`} className="flex items-center gap-2">
                <code
                  className="min-w-0 flex-1 font-mono text-base leading-6 break-all sm:text-lg"
                  data-testid={`pw-result-${index}`}
                >
                  {secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={labels.copy}
                  onClick={() => copySecret(secret)}
                  data-testid={`pw-copy-${index}`}
                >
                  <CopyIcon />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs text-muted-foreground" data-testid="pw-entropy">
            {labels.entropyLine.replace("{bits}", String(entropy))}
          </p>
          <span role="status" className="min-w-0 truncate text-xs text-muted-foreground">
            {feedback}
          </span>
        </div>

        {weak ? (
          <p className="text-xs text-muted-foreground" data-testid="pw-weak-hint">
            {labels.weakHint}
          </p>
        ) : null}
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel>{labels.presetsLabel}</FieldLabel>
          <ToggleGroup
            className="w-full flex-wrap gap-2"
            variant="outline"
            value={state.preset === "custom" ? [] : [state.preset]}
            onValueChange={(values) => {
              const nextValue = values[0];
              if (!nextValue) return;
              selectPreset(nextValue as SelectablePresetId);
            }}
          >
            {selectablePresetIds.map((preset) => (
              <ToggleGroupItem key={preset} value={preset} data-testid={`pw-preset-${preset}`}>
                {labels.presetNames[preset]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>{labels.presetsHint}</FieldDescription>
        </Field>

        <Collapsible>
          <CollapsibleTrigger data-testid="pw-custom-toggle">
            <span className="flex items-center gap-2">
              <SlidersHorizontalIcon data-icon="inline-start" />
              {labels.customLabel}
            </span>
            <ChevronDownIcon
              data-icon="inline-end"
              className="transition-transform group-data-panel-open/collapsible-trigger:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsiblePanel>
            <Field>
              <FieldLabel>{labels.modeLabel}</FieldLabel>
              <ToggleGroup
                className="w-full flex-wrap"
                variant="outline"
                value={[state.mode]}
                onValueChange={(values) => {
                  const nextValue = values[0];
                  if (!nextValue) return;
                  updateState({ mode: nextValue as GeneratorState["mode"] });
                }}
              >
                <ToggleGroupItem value="password" data-testid="pw-mode-password">
                  {labels.modeNames.password}
                </ToggleGroupItem>
                <ToggleGroupItem value="passphrase" data-testid="pw-mode-passphrase">
                  {labels.modeNames.passphrase}
                </ToggleGroupItem>
              </ToggleGroup>
              <FieldDescription>{labels.customHint}</FieldDescription>
            </Field>

            {state.mode === "password" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="pw-length">{labels.lengthLabel}</FieldLabel>
                  <div className="flex items-center gap-3">
                    <input
                      id="pw-length"
                      type="range"
                      min={lengthRange.min}
                      max={lengthRange.max}
                      step={1}
                      value={state.length}
                      onChange={(event) => updateState({ length: Number(event.target.value) })}
                      className="h-2 w-full cursor-pointer accent-foreground"
                      data-testid="pw-length"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-sm">
                      {state.length}
                    </span>
                  </div>
                  <FieldDescription>{labels.lengthHint}</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>{labels.typesLabel}</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {typeIds.map((typeId) => (
                      <Toggle
                        key={typeId}
                        variant="outline"
                        pressed={state[typeId]}
                        onPressedChange={(pressed) =>
                          updateState({ [typeId]: pressed } as Pick<GeneratorState, TypeId>)
                        }
                        data-testid={`pw-type-${typeId}`}
                      >
                        {labels.typeNames[typeId]}
                      </Toggle>
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>{labels.minPerTypeLabel}</FieldLabel>
                  <ToggleGroup
                    className="w-full flex-wrap"
                    variant="outline"
                    value={[String(state.minPerType)]}
                    onValueChange={(values) => {
                      const nextValue = values[0];
                      if (nextValue === undefined) return;
                      updateState({ minPerType: Number(nextValue) });
                    }}
                  >
                    {minPerTypeOptions.map((option) => (
                      <ToggleGroupItem
                        key={option}
                        value={String(option)}
                        data-testid={`pw-min-${option}`}
                      >
                        {labels.minPerTypeNames[
                          String(option) as keyof typeof labels.minPerTypeNames
                        ]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>{labels.minPerTypeHint}</FieldDescription>
                </Field>

                <div className="flex flex-wrap gap-2">
                  <Toggle
                    variant="outline"
                    pressed={state.excludeAmbiguous}
                    onPressedChange={(pressed) => updateState({ excludeAmbiguous: pressed })}
                    data-testid="pw-noambig"
                  >
                    {labels.excludeAmbiguousLabel}
                  </Toggle>
                </div>

                <Field>
                  <FieldLabel htmlFor="pw-charset">{labels.customCharsetLabel}</FieldLabel>
                  <Input
                    id="pw-charset"
                    value={state.customCharset}
                    placeholder={labels.customCharsetPlaceholder}
                    onChange={(event) => updateState({ customCharset: event.target.value })}
                    data-testid="pw-charset"
                  />
                  <FieldDescription>{labels.customCharsetHint}</FieldDescription>
                </Field>
              </>
            ) : (
              <>
                <Field>
                  <FieldLabel htmlFor="pw-words">{labels.wordCountLabel}</FieldLabel>
                  <div className="flex items-center gap-3">
                    <input
                      id="pw-words"
                      type="range"
                      min={wordCountRange.min}
                      max={wordCountRange.max}
                      step={1}
                      value={state.wordCount}
                      onChange={(event) => updateState({ wordCount: Number(event.target.value) })}
                      className="h-2 w-full cursor-pointer accent-foreground"
                      data-testid="pw-words"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-sm">
                      {state.wordCount}
                    </span>
                  </div>
                  <FieldDescription>{labels.wordCountHint}</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel>{labels.separatorLabel}</FieldLabel>
                  <ToggleGroup
                    className="w-full flex-wrap"
                    variant="outline"
                    value={[state.separator]}
                    onValueChange={(values) => {
                      const nextValue = values[0];
                      if (!nextValue) return;
                      updateState({ separator: nextValue as GeneratorState["separator"] });
                    }}
                  >
                    {separatorIds.map((separator) => (
                      <ToggleGroupItem
                        key={separator}
                        value={separator}
                        data-testid={`pw-sep-${separator}`}
                      >
                        {labels.separatorNames[separator]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Field>

                {state.separator === "custom" ? (
                  <Field>
                    <FieldLabel htmlFor="pw-sep-custom">{labels.customSeparatorLabel}</FieldLabel>
                    <Input
                      id="pw-sep-custom"
                      value={state.customSeparator}
                      placeholder={labels.customSeparatorPlaceholder}
                      maxLength={3}
                      onChange={(event) => updateState({ customSeparator: event.target.value })}
                      data-testid="pw-sep-custom"
                    />
                  </Field>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Toggle
                    variant="outline"
                    pressed={state.capitalize}
                    onPressedChange={(pressed) => updateState({ capitalize: pressed })}
                    data-testid="pw-capitalize"
                  >
                    {labels.capitalizeLabel}
                  </Toggle>
                  <Toggle
                    variant="outline"
                    pressed={state.appendNumber}
                    onPressedChange={(pressed) => updateState({ appendNumber: pressed })}
                    data-testid="pw-append-number"
                  >
                    {labels.appendNumberLabel}
                  </Toggle>
                </div>
              </>
            )}

            <Field>
              <FieldLabel htmlFor="pw-batch">{labels.batchLabel}</FieldLabel>
              <div className="flex items-center gap-3">
                <input
                  id="pw-batch"
                  type="range"
                  min={batchRange.min}
                  max={batchRange.max}
                  step={1}
                  value={state.batch}
                  onChange={(event) => updateState({ batch: Number(event.target.value) })}
                  className="h-2 w-full cursor-pointer accent-foreground"
                  data-testid="pw-batch"
                />
                <span className="w-10 shrink-0 text-right font-mono text-sm">{state.batch}</span>
              </div>
              <FieldDescription>{labels.batchHint}</FieldDescription>
            </Field>

            <div className="flex flex-col gap-1 border-t border-border/60 pt-4">
              <p className="text-sm font-medium">{labels.howItWorksTitle}</p>
              <p className="text-xs leading-5 text-muted-foreground">{labels.howItWorksBody}</p>
            </div>
          </CollapsiblePanel>
        </Collapsible>
      </FieldGroup>

      <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border/60 pt-4">
        <p className="max-w-md text-xs leading-5 text-muted-foreground">{labels.privacyNote}</p>
        <ShareToXButton
          labels={shareLabels}
          tool="password-generator"
          title={labels.title}
          description={labels.description}
          url={shareUrl}
        />
      </div>
    </div>
  );
}
