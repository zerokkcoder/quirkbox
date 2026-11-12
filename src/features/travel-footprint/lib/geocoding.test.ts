import { afterEach, describe, expect, it, vi } from "vitest";
import { GeocodingError, searchPlaces } from "@/features/travel-footprint/lib/geocoding";

function jsonResponse(
  payload: unknown,
  init: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => payload,
  } as unknown as Response;
}

/** A fetch stub that rejects with an AbortError whenever its signal aborts. */
function abortableFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("searchPlaces", () => {
  it("parses the FeatureCollection into results with composed names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        type: "FeatureCollection",
        features: [
          {
            geometry: { coordinates: [135.7681, 35.0116] },
            properties: { osm_id: 1, osm_type: "N", name: "Kyoto", city: "Kyoto", country: "Japan" },
          },
          {
            geometry: { coordinates: [2.2945, 48.8584] },
            properties: { osm_id: 2, osm_type: "W", name: "Eiffel Tower", city: "Paris", country: "France" },
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const results = await searchPlaces("kyoto");

    expect(results).toEqual([
      { id: "N/1", name: "Kyoto, Japan", longitude: 135.7681, latitude: 35.0116 },
      { id: "W/2", name: "Eiffel Tower, France", longitude: 2.2945, latitude: 48.8584 },
    ]);

    const requested = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requested.origin + requested.pathname).toBe("https://photon.komoot.io/api/");
    expect(requested.searchParams.get("q")).toBe("kyoto");
    expect(requested.searchParams.get("limit")).toBe("5");
    expect(requested.searchParams.get("lang")).toBe("en");
  });

  it("falls back to city, street or state when name is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          features: [
            { geometry: { coordinates: [10, 20] }, properties: { city: "Lisbon", country: "Portugal" } },
            { geometry: { coordinates: [11, 21] }, properties: { street: "Main St", country: "Portugal" } },
            { geometry: { coordinates: [12, 22] }, properties: { state: "Bavaria" } },
          ],
        }),
      ),
    );

    const results = await searchPlaces("lisbon");

    expect(results.map((place) => place.name)).toEqual([
      "Lisbon, Portugal",
      "Main St, Portugal",
      "Bavaria",
    ]);
  });

  it("drops duplicate subject/country pairs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          features: [
            { geometry: { coordinates: [103.8, 1.35] }, properties: { name: "Singapore", country: "Singapore" } },
          ],
        }),
      ),
    );

    const results = await searchPlaces("singapore");

    expect(results[0].name).toBe("Singapore");
  });

  it("discards entries with out-of-range or non-numeric coordinates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          features: [
            { geometry: { coordinates: [200, 10] }, properties: { name: "Bad longitude" } },
            { geometry: { coordinates: [10, 100] }, properties: { name: "Bad latitude" } },
            { geometry: { coordinates: ["a", 20] }, properties: { name: "Non numeric" } },
            { geometry: { coordinates: [10] }, properties: { name: "Too short" } },
            { geometry: {}, properties: { name: "No geometry" } },
            { geometry: { coordinates: [10, 20] }, properties: {} },
            { geometry: { coordinates: [10, 20] }, properties: { name: "  " } },
            { geometry: { coordinates: [10, 20] }, properties: { name: "Good place", country: "Nowhere" } },
          ],
        }),
      ),
    );

    const results = await searchPlaces("good");

    expect(results).toEqual([
      { id: "10,20", name: "Good place, Nowhere", longitude: 10, latitude: 20 },
    ]);
  });

  it("returns no results and skips the request for a blank query", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchPlaces("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects with a GeocodingError on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, { ok: false, status: 503 })));

    await expect(searchPlaces("kyoto")).rejects.toBeInstanceOf(GeocodingError);
  });

  it("rejects with a GeocodingError when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network down")));

    await expect(searchPlaces("kyoto")).rejects.toBeInstanceOf(GeocodingError);
  });

  it("rejects with a GeocodingError when the payload is not a FeatureCollection", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ unexpected: true })));

    await expect(searchPlaces("kyoto")).rejects.toBeInstanceOf(GeocodingError);
  });

  it("rejects with a GeocodingError once the internal timeout elapses", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", abortableFetch());

    const promise = searchPlaces("kyoto");
    const assertion = expect(promise).rejects.toBeInstanceOf(GeocodingError);

    await vi.advanceTimersByTimeAsync(8000);

    await assertion;
  });

  it("rejects with a GeocodingError when the caller aborts and stops parsing", async () => {
    const controller = new AbortController();
    const fetchMock = abortableFetch();
    vi.stubGlobal("fetch", fetchMock);

    const promise = searchPlaces("kyoto", { signal: controller.signal });
    const assertion = expect(promise).rejects.toBeInstanceOf(GeocodingError);

    controller.abort();

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
