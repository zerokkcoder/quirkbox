export type AnalyticsEvent = {
  name: string;
  metadata?: Record<string, string | number | boolean>;
};

export function trackEvent(event: AnalyticsEvent) {
  void event;
  return;
}
