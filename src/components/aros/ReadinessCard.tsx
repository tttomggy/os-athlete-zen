import { readinessLabel, readinessScore, type Readiness } from "@/lib/os-store";
import { useState } from "react";

function defaultEnergyFromSleep(hours: number) {
  if (hours < 5) return 3;
  if (hours <= 7) return 5;
  if (hours <= 9) return 8;
  return 9;
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        <span className="font-display text-base font-bold text-foreground">{display}</span>
      </div>
      <input
        type="range"
        className="track-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}

export function ReadinessCard({
  readiness,
  onChange,
}: {
  readiness: Readiness;
  onChange: (r: Readiness) => void;
}) {
  const [energyOverridden, setEnergyOverridden] = useState(false);
  const score = readinessScore(readiness);

  const handleSleepChange = (v: number) => {
    const next = { ...readiness, sleepHours: v };
    if (!energyOverridden) {
      next.energy = defaultEnergyFromSleep(v);
    }
    onChange(next);
  };

  const handleEnergyChange = (v: number) => {
    setEnergyOverridden(true);
    onChange({ ...readiness, energy: v });
  };

  return (
    <section className="glass-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Daily readiness
          </p>
          <h1 className="truncate font-display text-2xl font-bold">{readinessLabel(score)}</h1>
        </div>
        <div
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${score}%, oklch(1 0 0 / 10%) ${score}% 100%)`,
          }}
        >
          <div className="grid h-[3.9rem] w-[3.9rem] place-items-center rounded-full bg-background/85">
            <span className="font-display text-xl font-bold text-primary">{score}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Slider
          label="Sleep hours"
          value={readiness.sleepHours}
          display={`${readiness.sleepHours.toFixed(1)} h`}
          min={0}
          max={12}
          step={0.5}
          onChange={(v) => onChange({ ...readiness, sleepHours: v })}
        />
        <Slider
          label="Energy level"
          value={readiness.energy}
          display={`${readiness.energy} / 10`}
          min={1}
          max={10}
          step={1}
          onChange={(v) => onChange({ ...readiness, energy: v })}
        />
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Body weight
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-bold">
                {readiness.weight.toFixed(1)}
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...readiness,
                    unit: readiness.unit === "kg" ? "lbs" : "kg",
                    weight:
                      readiness.unit === "kg"
                        ? Math.round(readiness.weight * 2.2046 * 10) / 10
                        : Math.round((readiness.weight / 2.2046) * 10) / 10,
                  })
                }
                className="rounded-full border border-border bg-glass-strong px-2.5 py-1 text-xs font-bold uppercase tracking-widest text-foreground"
              >
                {readiness.unit}
              </button>
            </div>
          </div>
          <input
            type="range"
            className="track-slider"
            min={readiness.unit === "kg" ? 35 : 77}
            max={readiness.unit === "kg" ? 160 : 353}
            step={0.5}
            value={readiness.weight}
            onChange={(e) => onChange({ ...readiness, weight: Number(e.target.value) })}
            aria-label="Body weight"
          />
        </div>
      </div>
    </section>
  );
}
