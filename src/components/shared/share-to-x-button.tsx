"use client";

import { useEffect, useRef, useState } from "react";
import { Share2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import type { Messages } from "@/lib/i18n";
import { buildShareText, deliverShare } from "@/lib/share/x-share";

const feedbackDurationMs = 5000;

export function ShareToXButton({
  labels,
  tool,
  title,
  description,
  url,
  size = "default",
}: {
  labels: Messages["share"];
  tool: string;
  title: string;
  description: string;
  url: string;
  size?: "default" | "sm";
}) {
  const [feedback, setFeedback] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  function clearFeedback() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setFeedback("");
  }

  function scheduleFeedbackClear() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setFeedback("");
      timerRef.current = null;
    }, feedbackDurationMs);
  }

  function handleShare() {
    clearFeedback();

    // Staying synchronous keeps the click's user activation alive for the
    // window.open inside deliverShare.
    const status = deliverShare({ text: buildShareText({ title, description }), url });

    setFeedback(labels[status]);
    trackEvent({ name: "share_to_x", metadata: { tool, status } });
    scheduleFeedbackClear();
  }

  return (
    <span className="flex min-w-0 items-center gap-2">
      <Button variant="outline" size={size} onClick={handleShare}>
        <Share2Icon data-icon="inline-start" />
        {labels.action}
      </Button>
      <span
        role="status"
        title={feedback || undefined}
        className="min-w-0 truncate text-xs text-muted-foreground"
      >
        {feedback}
      </span>
    </span>
  );
}
