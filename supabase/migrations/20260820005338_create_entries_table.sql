/*
# Create entries table with fuel hand-measure columns

1. New Tables
- `public.entries`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `type` (text, not null) — one of 'swim', 'gym', 'fuel', 'recovery'
  - `title` (text, not null)
  - `subtitle` (text, nullable)
  - `details` (text[], not null, default '{}')
  - `created_at` (timestamptz, not null, default now())
  - `fuel_protein_palms` (integer, nullable) — protein portions counted as "palms"
  - `fuel_carb_cups` (integer, nullable) — carb portions counted as "cups"
  - `fuel_fat_thumbs` (integer, nullable) — fat portions counted as "thumbs"
  - `notes` (text, nullable) — free-text notes attached to any entry
2. Security
- Enable RLS on `entries`.
- Single-tenant personal app (no sign-in): open CRUD for anon + authenticated via the publishable key.
3. Notes
- Idempotent: uses IF NOT EXISTS for table and index; policies are dropped before recreate.
- Realtime publication is added for live timeline updates (guarded by a DO block).
*/

CREATE TABLE IF NOT EXISTS public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('swim','gym','fuel','recovery')),
  title text NOT NULL,
  subtitle text,
  details text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  fuel_protein_palms integer,
  fuel_carb_cups integer,
  fuel_fat_thumbs integer,
  notes text
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entries readable" ON public.entries;
CREATE POLICY "entries readable" ON public.entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "entries insertable" ON public.entries;
CREATE POLICY "entries insertable" ON public.entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "entries updatable" ON public.entries;
CREATE POLICY "entries updatable" ON public.entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "entries deletable" ON public.entries;
CREATE POLICY "entries deletable" ON public.entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS entries_created_at_idx ON public.entries (created_at DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
