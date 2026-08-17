import { useCallback, useEffect, useState } from "react";
import { supabase, type EntryRow } from "@/integrations/supabase/client";

export type EntryKind = EntryRow["type"];

export type Entry = {
  id: string;
  kind: EntryKind;
  at: string;
  title: string;
  details: string[];
  proteinPalms: number | null;
  carbCups: number | null;
  fatThumbs: number | null;
  notes: string | null;
};

export type EntryExtras = {
  fuel_protein_palms?: number | null;
  fuel_carb_cups?: number | null;
  fuel_fat_thumbs?: number | null;
  notes?: string | null;
};

export type Readiness = {
  sleepHours: number;
  energy: number;
  weight: number;
  unit: "kg" | "lbs";
};

const READINESS_KEY = "aros.readiness.v1";

const BASE_COLS = "id, type, title, subtitle, details, created_at";
const EXT_COLS = `${BASE_COLS}, fuel_protein_palms, fuel_carb_cups, fuel_fat_thumbs, notes`;

/** Flipped to false when the database has not been migrated with the hand-measure columns yet. */
let extendedSchema = true;
export const cols = () => (extendedSchema ? EXT_COLS : BASE_COLS);
const isMissingColumn = (err: { code?: string; message?: string } | null) =>
  err?.code === "42703" || /does not exist/i.test(err?.message ?? "");

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

export function toEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    kind: row.type,
    at: row.created_at,
    title: row.title,
    details: row.details ?? [],
    proteinPalms: row.fuel_protein_palms ?? null,
    carbCups: row.fuel_carb_cups ?? null,
    fatThumbs: row.fuel_fat_thumbs ?? null,
    notes: row.notes ?? null,
  };
}

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function useAthleticOS() {
  const [history, setHistory] = useState<Entry[]>([]);
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
    const run = () =>
      supabase
        .from("entries")
        .select(cols())
        .gte("created_at", daysAgoISO(30))
        .order("created_at", { ascending: false });

    let { data, error: err } = await run();
    if (err && isMissingColumn(err)) {
      extendedSchema = false;
      ({ data, error: err } = await run());
    }

    if (err) setError(err.message);
    else {
      setError(null);
      setHistory(((data ?? []) as unknown as EntryRow[]).map(toEntry));
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
    async (kind: EntryKind, title: string, details: string[], extras?: EntryExtras) => {
      const clean = details.filter(Boolean);
      const optimistic: Entry = {
        id: `temp-${Date.now()}`,
        kind,
        at: new Date().toISOString(),
        title,
        details: clean,
        proteinPalms: extras?.fuel_protein_palms ?? null,
        carbCups: extras?.fuel_carb_cups ?? null,
        fatThumbs: extras?.fuel_fat_thumbs ?? null,
        notes: extras?.notes ?? null,
      };
      setHistory((prev) => [optimistic, ...prev]);

      const base = { type: kind, title, details: clean };
      const run = (withExtras: boolean) =>
        supabase
          .from("entries")
          .insert(withExtras && extras ? { ...base, ...extras } : base)
          .select(cols())
          .single();

      let { data, error: err } = await run(extendedSchema);
      if (err && isMissingColumn(err)) {
        extendedSchema = false;
        ({ data, error: err } = await run(false));
      }

      if (err) {
        setHistory((prev) => prev.filter((e) => e.id !== optimistic.id));
        setError(err.message);
        return;
      }
      setError(null);
      const saved = toEntry(data as unknown as EntryRow);
      setHistory((prev) => [saved, ...prev.filter((e) => e.id !== optimistic.id && e.id !== saved.id)]);
    },
    [],
  );

  const removeEntry = useCallback(
    async (id: string) => {
      const snapshot = history;
      setHistory((prev) => prev.filter((e) => e.id !== id));
      const { error: err } = await supabase.from("entries").delete().eq("id", id);
      if (err) {
        setHistory(snapshot);
        setError(err.message);
      }
    },
    [history],
  );

  const todayStart = startOfTodayISO();
  const today = history.filter((e) => e.at >= todayStart);

  return { today, history, loading, error, readiness, setReadiness, addEntry, removeEntry };
}
