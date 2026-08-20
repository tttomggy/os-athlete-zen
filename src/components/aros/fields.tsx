import type { ReactNode } from "react";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="glass-field h-12 w-full px-3.5 text-base font-medium"
      inputMode={props.inputMode}
    />
  );
}

export function SelectInput({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[] }) {
  return (
    <select {...props} className="glass-field h-12 w-full px-3 text-base font-medium">
      {options.map((o) => (
        <option key={o} value={o} className="bg-card text-card-foreground">
          {o}
        </option>
      ))}
    </select>
  );
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="h-14 w-full rounded-xl bg-primary text-base font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-[0_0_28px_-8px_var(--primary)] transition-transform active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function ChipRow({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
            value === o
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-glass text-muted-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  accent = "var(--primary)",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  accent?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div>
      <span className="mb-1.5 block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border text-2xl font-bold transition-transform active:scale-90 disabled:opacity-40"
          style={{
            borderColor: `color-mix(in oklab, ${accent} 55%, transparent)`,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            color: accent,
          }}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div
          className="flex h-12 flex-1 items-center justify-center rounded-xl border text-xl font-bold tabular-nums"
          style={{
            borderColor: "var(--border)",
            background: "var(--glass)",
            color: accent,
          }}
        >
          {value}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border text-2xl font-bold transition-transform active:scale-90 disabled:opacity-40"
          style={{
            borderColor: `color-mix(in oklab, ${accent} 55%, transparent)`,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            color: accent,
          }}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
