import { useCallback, useEffect, useState } from "react";
import { supabase, type EntryRow } from "@/integrations/supabase/client";

export type EntryKind = EntryRow["type"];

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

const READINESS_KEY = "aros.readiness.v1";

export const defaultReadiness: Readiness = {
  sleepHours: 7.5,
  energy: 7,
  weight: 78,
  unit: "kg",
};

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

function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    kind: row.type,
    at: row.created_at,
    title: row.title,
    details: row.details ?? [],
  };
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useAthleticOS() {
  const [today, setToday] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<Readiness>(defaultReadiness);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READINESS_KEY);
      if (raw) setReadiness(JSON.parse(raw) as Readiness);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(READINESS_KEY, JSON.stringify(readiness));
  }, [readiness, hydrated]);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("entries")
      .select("id, type, title, subtitle, details, created_at")
      .gte("created_at", startOfTodayISO())
      .order("created_at", { ascending: false });

    if (err) setError(err.message);
    else {
      setError(null);
      setToday((data as EntryRow[]).map(toEntry));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel("entries-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "entries" },
        () => void refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  const addEntry = useCallback(
    async (kind: EntryKind, title: string, details: string[]) => {
      const clean = details.filter(Boolean);
      const optimistic: Entry = {
        id: `temp-${Date.now()}`,
        kind,
        at: new Date().toISOString(),
        title,
        details: clean,
      };
      setToday((prev) => [optimistic, ...prev]);

      const { data, error: err } = await supabase
        .from("entries")
        .insert({ type: kind, title, details: clean })
        .select("id, type, title, subtitle, details, created_at")
        .single();

      if (err) {
        setToday((prev) => prev.filter((e) => e.id !== optimistic.id));
        setError(err.message);
        return;
      }
      setError(null);
      setToday((prev) => [
        toEntry(data as EntryRow),
        ...prev.filter((e) => e.id !== optimistic.id && e.id !== (data as EntryRow).id),
      ]);
    },
    [],
  );

  const removeEntry = useCallback(async (id: string) => {
    const snapshot = today;
    setToday((prev) => prev.filter((e) => e.id !== id));
    const { error: err } = await supabase.from("entries").delete().eq("id", id);
    if (err) {
      setToday(snapshot);
      setError(err.message);
    }
  }, [today]);

  return { today, loading, error, readiness, setReadiness, addEntry, removeEntry };
}
