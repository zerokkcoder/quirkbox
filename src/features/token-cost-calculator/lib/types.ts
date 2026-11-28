export type LlmPrice = {
  vendor: string;
  model: string;
  inputPerM: number;
  outputPerM: number;
  currency: "USD" | "CNY";
  promoUntil?: string;
  regularInputPerM?: number;
  regularOutputPerM?: number;
  source?: string;
  confidence?: "official" | "medium" | "low";
};

export type RatesData = {
  meta: {
    updatedAt: string;
    note?: string;
    /** USD → CNY reference rate, refreshed by npm run rates:update. */
    exchangeRate?: number;
    fxDate?: string;
    fxSource?: string;
  };
  llmPricing: LlmPrice[];
};
