import type { Entry, EntryKind } from "@/lib/os-store";

const meta: Record<EntryKind, { icon: string; label: string; color: string }> = {
  swim: { icon: "🏊", label: "Swim", color: "var(--swim)" },
  gym: { icon: "🏋️", label: "Gym", color: "var(--gym)" },
  fuel: { icon: "🥗", label: "Fuel", color: "var(--fuel)" },
  recovery: { icon: "😴", label: "Recovery", color: "var(--recovery)" },
};

export function Timeline({
  entries,
  loading,
  error,
  onRemove,
}: {
  entries: Entry[];
  loading?: boolean;
  error?: string | null;
  onRemove: (id: string) => void | Promise<void>;
}) {

  return (
    <section className="glass-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="truncate text-lg font-bold">Today's timeline</h2>
        <span className="shrink-0 rounded-full border border-border bg-glass-strong px-2.5 py-1 text-xs font-bold text-muted-foreground">
          {entries.length} logged
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/50 bg-destructive/15 p-3 text-sm text-foreground">
          Couldn't reach your database: {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Syncing today's log…</p>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing yet today. Log a session above and it lands here instantly.
        </p>
      ) : (

        <ul className="mt-4 space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="relative flex gap-3 pl-1">
              <div className="flex flex-col items-center">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg"
                  style={{
                    background: `color-mix(in oklab, ${meta[e.kind].color} 22%, transparent)`,
                    border: `1px solid color-mix(in oklab, ${meta[e.kind].color} 55%, transparent)`,
                  }}
                >
                  {meta[e.kind].icon}
                </span>
                <span className="mt-1 w-px flex-1 bg-border" />
              </div>
              <div className="min-w-0 flex-1 pb-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <p className="truncate font-semibold">{e.title}</p>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {new Date(e.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[meta[e.kind].label, ...e.details].join(" · ")}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(e.id)}
                  className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors active:text-destructive"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
