import type { Entry } from "@/lib/os-store";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportCsv(entries: Entry[]) {
  const header = [
    "id",
    "type",
    "title",
    "created_at",
    "details",
    "protein_palms",
    "carb_cups",
    "fat_thumbs",
    "notes",
  ];
  const rows = entries.map((e) =>
    [
      e.id,
      e.kind,
      e.title,
      e.at,
      e.details.join("; "),
      e.proteinPalms,
      e.carbCups,
      e.fatThumbs,
      e.notes,
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  download("athletic-os-entries.csv", csv, "text/csv;charset=utf-8");
}

export function exportJson(entries: Entry[]) {
  const payload = entries.map((e) => ({
    id: e.id,
    type: e.kind,
    title: e.title,
    created_at: e.at,
    details: e.details,
    protein_palms: e.proteinPalms,
    carb_cups: e.carbCups,
    fat_thumbs: e.fatThumbs,
    notes: e.notes,
  }));
  download("athletic-os-entries.json", JSON.stringify(payload, null, 2), "application/json");
}
