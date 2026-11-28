"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CoffeeIcon, XIcon } from "lucide-react";
import type { Locale } from "@/config/site";
import { getMessages } from "@/lib/i18n";
import { fetchCountryCode, usesQrPayment } from "@/lib/region";
import { cn } from "@/lib/utils";

const koFiUrl = "https://ko-fi.com/starrudder";

export function SupportCreator({
  locale,
  variant = "footer",
}: {
  locale: Locale;
  variant?: "header" | "footer" | "tool";
}) {
  const labels = getMessages(locale).support;
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetchCountryCode().then((code) => {
      if (active) setCountryCode(code);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const useQr = usesQrPayment(locale, countryCode);

  const triggerClass = cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full transition-colors",
    variant === "header"
      ? "border border-primary/60 px-2.5 py-1.5 text-xs font-medium text-primary transition-[border-color,background-color,transform] duration-150 ease-[var(--ease-out)] hover:border-primary hover:bg-primary/10 active:scale-[0.97] sm:px-3"
      : "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground active:scale-[0.97]"
  );
  const triggerLabel = (
    <>
      <CoffeeIcon aria-hidden className="size-4" />
      <span className={cn(variant === "header" && "hidden sm:inline")}>{labels.action}</span>
    </>
  );

  return (
    <>
      {useQr ? (
        <button
          type="button"
          data-testid="support-button"
          onClick={() => setOpen(true)}
          className={triggerClass}
        >
          {triggerLabel}
        </button>
      ) : (
        <a
          data-testid="support-button"
          href={koFiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={triggerClass}
        >
          {triggerLabel}
        </a>
      )}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="support-dialog-backdrop fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/60 p-4"
              onClick={() => setOpen(false)}
              role="presentation"
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={labels.qrTitle}
                onClick={(event) => event.stopPropagation()}
                className="support-dialog-card my-auto w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-base font-semibold tracking-tight">{labels.qrTitle}</h2>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={labels.close}
                    className="rounded-full p-1 text-muted-foreground transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] hover:bg-hover hover:text-foreground active:scale-90"
                  >
                    <XIcon aria-hidden className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <figure className="flex min-w-0 flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static local QR assets */}
                    <img
                      src="/wechat-pay.jpg"
                      alt={labels.wechat}
                      className="aspect-square w-full rounded-xl border border-primary/50 object-cover"
                    />
                    <figcaption className="text-xs text-muted-foreground">{labels.wechat}</figcaption>
                  </figure>
                  <figure className="flex min-w-0 flex-col items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static local QR assets */}
                    <img
                      src="/allipay.jpg"
                      alt={labels.alipay}
                      className="aspect-square w-full rounded-xl border border-primary/50 object-cover"
                    />
                    <figcaption className="text-xs text-muted-foreground">{labels.alipay}</figcaption>
                  </figure>
                </div>
                <p className="mt-4 text-center text-xs text-muted-foreground">{labels.hint}</p>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
