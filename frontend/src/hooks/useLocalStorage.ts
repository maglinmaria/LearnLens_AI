import React from "react";

/**
 * useDarkMode – detects OS dark preference; can be overridden.
 */
export function useDarkMode() {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem("learnlens_theme");
    if (stored) {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  const toggle = React.useCallback(() => {
    setIsDark((d) => {
      const next = !d;
      localStorage.setItem("learnlens_theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { isDark, toggle };
}

/**
 * useLocalStorage – typed wrapper around window.localStorage.
 */
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = React.useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStored = React.useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [key]
  );

  return [value, setStored] as const;
}
