import { useCallback, useEffect, useState } from "react";

export type EntryKind = "swim" | "gym" | "fuel" | "recovery";

export type Entry = {
  id: string;
  kind: EntryKind;
  at: string;
  title: string;
  details: string[];
};

export type Readiness = {
  sleepHours: number;
  energy: number;
  weight: number;
  unit: "kg" | "lbs";
};

const ENTRIES_KEY = "aros.entries.v1";
const READINESS_KEY = "aros.readiness.v1";

export const defaultReadiness: Readiness = {
  sleepHours: 7.5,
  energy: 7,
  weight: 78,
  unit: "kg",
};

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export function readinessScore(r: Readiness) {
  const sleep = Math.min(r.sleepHours / 8, 1) * 55;
  const energy = (r.energy / 10) * 45;
  return Math.round(Math.max(1, Math.min(100, sleep + energy)));
}

export function readinessLabel(score: number) {
  if (score >= 85) return "Primed";
  if (score >= 70) return "Ready";
  if (score >= 50) return "Maintain";
  return "Recover";
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useAthleticOS() {
  const [hydrated, setHydrated] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [readiness, setReadiness] = useState<Readiness>(defaultReadiness);

  useEffect(() => {
    setEntries(load<Entry[]>(ENTRIES_KEY, []));
    setReadiness(load<Readiness>(READINESS_KEY, defaultReadiness));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries, hydrated]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(READINESS_KEY, JSON.stringify(readiness));
  }, [readiness, hydrated]);

  const addEntry = useCallback((kind: EntryKind, title: string, details: string[]) => {
    setEntries((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        at: new Date().toISOString(),
        title,
        details: details.filter(Boolean),
      },
      ...prev,
    ]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const today = entries.filter((e) => isToday(e.at));

  return { hydrated, entries, today, readiness, setReadiness, addEntry, removeEntry };
}
