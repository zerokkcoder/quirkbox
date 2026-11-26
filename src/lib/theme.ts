export type ThemePreference = "light" | "dark" | "system";

export const themeStorageKey = "starrudder-theme";

export function normalizeThemePreference(value?: string | null): ThemePreference {
  return value === "dark" || value === "system" ? value : "light";
}

export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): "light" | "dark" {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

/** Applied before hydration so the first paint already uses the saved theme. */
export const themeInitScript = `(function(){try{var k=${JSON.stringify(themeStorageKey)};var p=localStorage.getItem(k);if(p!=="light"&&p!=="dark"&&p!=="system")p="light";var d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.remove("light");r.classList.toggle("dark",d);r.dataset.theme=p;r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

/** Keeps the document in sync with a preference chosen after hydration. */
export function applyThemePreference(preference: ThemePreference, systemPrefersDark: boolean): void {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(preference, systemPrefersDark);
  const root = document.documentElement;
  root.classList.remove("light");
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = preference;
  root.style.colorScheme = resolved;

  try {
    window.localStorage.setItem(themeStorageKey, preference);
  } catch {
    // Private browsing or blocked storage: the choice still applies this visit.
  }
}

export function readThemePreference(): ThemePreference {
  if (typeof document === "undefined") return "light";
  return normalizeThemePreference(document.documentElement.dataset.theme);
}
