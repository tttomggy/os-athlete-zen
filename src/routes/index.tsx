import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ReadinessCard } from "@/components/aros/ReadinessCard";
import { FuelForm, GymForm, RecoveryForm, SwimForm } from "@/components/aros/LogForms";
import { Timeline } from "@/components/aros/Timeline";
import { Insights } from "@/components/aros/Insights";
import { useAthleticOS, type EntryKind } from "@/lib/os-store";
import { exportCsv, exportJson } from "@/lib/export";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Athletic & Recovery OS — Daily Training Log" },
      {
        name: "description",
        content:
          "Track readiness, swim sets, lifts, fuel, and recovery in one dark, one-handed mobile training log.",
      },
      { property: "og:title", content: "Athletic & Recovery OS" },
      {
        property: "og:description",
        content: "Log readiness, swim, gym, fuel, and recovery from your phone in seconds.",
      },
    ],
  }),
  component: Index,
});

const TABS: { kind: EntryKind; icon: string; label: string; color: string }[] = [
  { kind: "swim", icon: "🏊", label: "Swim", color: "var(--swim)" },
  { kind: "gym", icon: "🏋️", label: "Gym", color: "var(--gym)" },
  { kind: "fuel", icon: "🥗", label: "Fuel", color: "var(--fuel)" },
  { kind: "recovery", icon: "😴", label: "Recovery", color: "var(--recovery)" },
];

type View = "today" | "insights";

function Index() {
  const { today, history, loading, error, readiness, setReadiness, addEntry, removeEntry } =
    useAthleticOS();
  const [active, setActive] = useState<EntryKind>("swim");
  const [view, setView] = useState<View>("today");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md space-y-5 px-4 pb-14 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex rounded-full border border-border bg-glass p-1">
          {(["today", "insights"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => exportCsv(history)}
            className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-foreground transition-transform active:scale-95"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportJson(history)}
            className="rounded-full border border-border bg-glass px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-foreground transition-transform active:scale-95"
          >
            JSON
          </button>
        </div>
      </header>

      {view === "today" ? (
        <>
          <ReadinessCard readiness={readiness} onChange={setReadiness} />

          <section className="glass-card p-4">
            <div className="grid grid-cols-4 gap-2">
              {TABS.map((t) => {
                const on = active === t.kind;
                return (
                  <button
                    key={t.kind}
                    type="button"
                    onClick={() => setActive(t.kind)}
                    className="flex flex-col items-center gap-1 rounded-xl border py-3 transition-transform active:scale-95"
                    style={{
                      background: on
                        ? `color-mix(in oklab, ${t.color} 26%, transparent)`
                        : "var(--glass)",
                      borderColor: on
                        ? `color-mix(in oklab, ${t.color} 65%, transparent)`
                        : "var(--border)",
                    }}
                  >
                    <span className="text-xl leading-none">{t.icon}</span>
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em]">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              {active === "swim" && <SwimForm onLog={addEntry} />}
              {active === "gym" && <GymForm onLog={addEntry} />}
              {active === "fuel" && <FuelForm onLog={addEntry} />}
              {active === "recovery" && <RecoveryForm onLog={addEntry} />}
            </div>
          </section>

          <Timeline entries={today} loading={loading} error={error} onRemove={removeEntry} />
        </>
      ) : (
        <Insights history={history} />
      )}
    </main>
  );
}
