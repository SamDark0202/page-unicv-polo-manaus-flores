import { useEffect, useRef, useState } from "react";

function resolveInitialValue<T>(value: T | (() => T)): T {
  return typeof value === "function" ? (value as () => T)() : value;
}

export function useSessionStorageState<T>(
  key: string,
  initialValue: T | (() => T),
) {
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const [state, setState] = useState<T>(() => {
    const fallback = resolveInitialValue(initialValueRef.current);
    if (typeof window === "undefined") return fallback;

    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    const fallback = resolveInitialValue(initialValueRef.current);
    if (typeof window === "undefined") {
      setState(fallback);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(key);
      setState(raw ? (JSON.parse(raw) as T) : fallback);
    } catch {
      setState(fallback);
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignora erros de storage (quota/privacidade) para não quebrar a UI.
    }
  }, [key, state]);

  return [state, setState] as const;
}
