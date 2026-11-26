/** Countries where the QR-code options (WeChat Pay / Alipay) are the useful path. */
const qrCountries = new Set(["CN", "HK", "MO"]);

let countryRequest: Promise<string | null> | null = null;

/**
 * One lightweight lookup per page load. Only the country code is consumed —
 * no IP, no cookies, no storage. Failures fall back to the UI locale.
 */
export function fetchCountryCode(): Promise<string | null> {
  if (countryRequest) return countryRequest;

  countryRequest = (async () => {
    try {
      const response = await fetch("https://ipwho.is/", {
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { success?: boolean; country_code?: string };
      return data.success === false ? null : data.country_code?.toUpperCase() ?? null;
    } catch {
      return null;
    }
  })();

  return countryRequest;
}

export function usesQrPayment(locale: string, countryCode: string | null): boolean {
  return locale === "zh-Hant" || (countryCode !== null && qrCountries.has(countryCode));
}
