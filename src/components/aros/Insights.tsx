import { useMemo } from "react";
import type { Entry } from "@/lib/os-store";

type Window = {
  label: string;
  days: number;
};

const WINDOWS: Window[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
];

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function avg(nums: number[]) {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function parseNumber(s: string | undefined): number | null {
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type Stats = {
  sleepAvg: number | null;
  workoutCount: number;
  swimMeters: number | null;
  gymVolume: number | null;
  fuelCalories: number | null;
  proteinPalms: number | null;
  carbCups: number | null;
  fatThumbs: number | null;
};

function computeStats(entries: Entry[]): Stats {
  const recovery = entries.filter((e) => e.kind === "recovery");
  const sleepHours = recovery
    .map((e) => {
      const m = e.title.match(/sleep\s+([\d.]+)\s*h/i);
      return m ? parseNumber(m[1]) : null;
    })
    .filter((n): n is number => n != null);

  const workouts = entries.filter((e) => e.kind === "swim" || e.kind === "gym");
  const swims = entries.filter((e) => e.kind === "swim");
  const swimMeters = swims
    .map((e) => {
      const m = e.title.match(/([\d.]+)\s*m/i);
      return m ? parseNumber(m[1]) : null;
    })
    .filter((n): n is number => n != null);

  const gym = entries.filter((e) => e.kind === "gym");
  const gymVolumes = gym
    .map((e) => {
      const setsMatch = e.details.find((d) => d.includes("×"));
      const weightMatch = e.details.find((d) => /kg/i.test(d));
      if (!setsMatch || !weightMatch) return null;
      const [s, r] = setsMatch.match(/(\d+)/g) ?? [];
      const w = weightMatch.match(/([\d.]+)\s*kg/i)?.[1];
      const sets = parseNumber(s ?? null);
      const reps = parseNumber(r ?? null);
      const weight = parseNumber(w ?? null);
      if (sets == null || reps == null || weight == null) return null;
      return sets * reps * weight;
    })
    .filter((n): n is number => n != null);

  const fuel = entries.filter((e) => e.kind === "fuel");
  const fuelCals = fuel
    .map((e) => {
      const d = e.details.find((x) => /kcal/i.test(x));
      return d ? parseNumber(d.match(/([\d.]+)\s*kcal/i)?.[1]) : null;
    })
    .filter((n): n is number => n != null);

  const palms = fuel.map((e) => e.proteinPalms).filter((n): n is number => n != null);
  const cups = fuel.map((e) => e.carbCups).filter((n): n is number => n != null);
  const thumbs = fuel.map((e) => e.fatThumbs).filter((n): n is number => n != null);

  return {
    sleepAvg: avg(sleepHours),
    workoutCount: workouts.length,
    swimMeters: avg(swimMeters),
    gymVolume: avg(gymVolumes),
    fuelCalories: avg(fuelCals),
    proteinPalms: avg(palms),
    carbCups: avg(cups),
    fatThumbs: avg(thumbs),
  };
}

function fmt(n: number | null, suffix = "", digits = 1) {
  if (n == null) return "—";
  return `${n.toFixed(digits)}${suffix}`;
}

function coachSummary(w7: Stats, w30: Stats): string {
  const lines: string[] = [];

  if (w7.sleepAvg != null) {
    if (w7.sleepAvg < 6) {
      lines.push(
        `Sleep is running low at ${w7.sleepAvg.toFixed(1)} h over the last week — prioritize an earlier wind-down and protect 7.5+ h tonight.`,
      );
    } else if (w7.sleepAvg >= 7.5) {
      lines.push(
        `Recovery foundation is solid: ${w7.sleepAvg.toFixed(1)} h average sleep this week. Keep the routine.`,
      );
    } else {
      lines.push(
        `Sleep is adequate at ${w7.sleepAvg.toFixed(1)} h but there's headroom — aim to nudge it past 7.5 h.`,
      );
    }
  }

  if (w7.workoutCount === 0) {
    lines.push("No training logged in the last 7 days. Schedule a light session to rebuild momentum.");
  } else {
    lines.push(`${w7.workoutCount} sessions this week.`);
  }

  if (w30.gymVolume != null && w7.gymVolume != null && w7.gymVolume > 0) {
    const change = ((w7.gymVolume - w30.gymVolume) / w30.gymVolume) * 100;
    if (change > 8) lines.push(`Gym volume is trending up ${Math.round(change)}% vs your 30-day baseline — great progression, watch recovery.`);
    else if (change < -8) lines.push(`Gym volume has dropped ${Math.round(Math.abs(change))}% vs your 30-day baseline — consider a deload or consistency reset.`);
  }

  if (w7.fuelCalories != null) {
    if (w7.fuelCalories < 1800) {
      lines.push(`Fuel intake is on the low side (${Math.round(w7.fuelCalories)} kcal/meal average) — make sure you're not under-eating for training load.`);
    } else {
      lines.push(`Fueling looks consistent at ${Math.round(w7.fuelCalories)} kcal/meal average this week.`);
    }
  }

  if (w7.proteinPalms != null && w7.proteinPalms < 2) {
    lines.push("Protein frequency is light — add a palm or two per meal to support muscle repair.");
  }

  return lines.join(" ");
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-glass p-3.5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold text-foreground">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function Insights({ history }: { history: Entry[] }) {
  const stats = useMemo(() => {
    const now = new Date();
    return WINDOWS.map((w) => {
      const cutoff = new Date(startOfDay(now));
      cutoff.setDate(cutoff.getDate() - (w.days - 1));
      const iso = cutoff.toISOString();
      const entries = history.filter((e) => e.at >= iso);
      return { ...w, stats: computeStats(entries) };
    });
  }, [history]);

  const coach = useMemo(() => {
    const w7 = stats[0]?.stats;
    const w30 = stats[1]?.stats;
    if (!w7 || !w30) return "";
    return coachSummary(w7, w30);
  }, [stats]);

  return (
    <section className="space-y-5">
      {stats.map((w) => (
        <div key={w.label} className="glass-card p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <h2 className="truncate text-lg font-bold">{w.label}</h2>
            <span className="shrink-0 rounded-full border border-border bg-glass-strong px-2.5 py-1 text-xs font-bold text-muted-foreground">
              {w.stats.workoutCount} sessions
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard
              label="Avg sleep"
              value={fmt(w.stats.sleepAvg, " h")}
              sub="per recovery log"
            />
            <StatCard
              label="Avg swim"
              value={fmt(w.stats.swimMeters, " m", 0)}
              sub="per swim session"
            />
            <StatCard
              label="Avg gym volume"
              value={w.stats.gymVolume != null ? fmt(w.stats.gymVolume, " kg", 0) : "—"}
              sub="sets×reps×kg / session"
            />
            <StatCard
              label="Avg fuel"
              value={fmt(w.stats.fuelCalories, " kcal", 0)}
              sub="per meal"
            />
            <StatCard
              label="Protein palms"
              value={fmt(w.stats.proteinPalms, "", 1)}
              sub="avg / meal"
            />
            <StatCard
              label="Carb cups"
              value={fmt(w.stats.carbCups, "", 1)}
              sub="avg / meal"
            />
            <StatCard
              label="Fat thumbs"
              value={fmt(w.stats.fatThumbs, "", 1)}
              sub="avg / meal"
            />
            <StatCard
              label="Workouts"
              value={`${w.stats.workoutCount}`}
              sub="swim + gym"
            />
          </div>
        </div>
      ))}

      <div className="glass-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h2 className="truncate text-lg font-bold">Coach summary</h2>
        </div>
        {coach ? (
          <p className="mt-3 text-sm leading-relaxed text-foreground">{coach}</p>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Log a few sessions, meals, and recovery entries to unlock your automated coach summary.
          </p>
        )}
      </div>
    </section>
  );
}
