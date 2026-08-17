import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe to ship in client code.
const SUPABASE_URL = "https://lonppmowkqcbxxqisnlq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fKrPt48kLk9-PDTuhvKi3Q_OcPoxeCG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type EntryRow = {
  id: string;
  /** Column is named `type` in the database. */
  type: "swim" | "gym" | "fuel" | "recovery";
  title: string;
  subtitle: string | null;
  details: string[] | null;
  created_at: string;
  /** Hand-measure fuel columns (added by SUPABASE_SETUP.sql). */
  fuel_protein_palms?: number | null;
  fuel_carb_cups?: number | null;
  fuel_fat_thumbs?: number | null;
  notes?: string | null;
};
