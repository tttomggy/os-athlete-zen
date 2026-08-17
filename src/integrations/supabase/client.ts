import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — safe to ship in client code.
const SUPABASE_URL = "https://lonppmowkqcbxxqisnlq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fKrPt48kLk9-PDTuhvKi3Q_OcPoxeCG";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type EntryRow = {
  id: string;
  kind: "swim" | "gym" | "fuel" | "recovery";
  title: string;
  details: string[];
  created_at: string;
};
