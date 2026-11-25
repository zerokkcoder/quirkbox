export function buildSearchString(
  current: URLSearchParams,
  updates: Record<string, string | undefined>
) {
  const next = new URLSearchParams(current);

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      next.delete(key);
      return;
    }

    next.set(key, value);
  });

  return next.toString();
}

/**
 * Call only from event handlers or effects — never from a `setState` updater
 * or the render phase. `history.replaceState` is patched by the App Router and
 * updates the Router component, which React forbids while rendering.
 */
export function replaceSearchState(
  pathname: string,
  current: URLSearchParams,
  updates: Record<string, string | undefined>
) {
  const query = buildSearchString(current, updates);
  const nextUrl = query ? `${pathname}?${query}` : pathname;
  window.history.replaceState(null, "", nextUrl);
}
