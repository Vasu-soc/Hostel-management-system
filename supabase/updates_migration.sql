-- ===================== MIGRATION 22: Updates Table =====================
CREATE TABLE IF NOT EXISTS public.updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('admin', 'warden')),
  author_name TEXT NOT NULL
);

ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Delete existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Allow public read access on updates" ON public.updates;
DROP POLICY IF EXISTS "Allow admin/warden to insert updates" ON public.updates;
DROP POLICY IF EXISTS "Allow admin/warden to update updates" ON public.updates;
DROP POLICY IF EXISTS "Allow admin/warden to delete updates" ON public.updates;

CREATE POLICY "Allow public read access on updates" ON public.updates FOR SELECT USING (true);
CREATE POLICY "Allow admin/warden to insert updates" ON public.updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin/warden to update updates" ON public.updates FOR UPDATE USING (true);
CREATE POLICY "Allow admin/warden to delete updates" ON public.updates FOR DELETE USING (true);

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'updates') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.updates;
    END IF;
END $$;

-- Storage bucket for update images
INSERT INTO storage.buckets (id, name, public) VALUES ('updates', 'updates', true) ON CONFLICT (id) DO NOTHING;

-- Delete existing storage policies if they exist
DROP POLICY IF EXISTS "Update images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update update images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete update images" ON storage.objects;

CREATE POLICY "Update images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'updates');
CREATE POLICY "Anyone can upload update images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'updates');
CREATE POLICY "Anyone can update update images" ON storage.objects FOR UPDATE USING (bucket_id = 'updates');
CREATE POLICY "Anyone can delete update images" ON storage.objects FOR DELETE USING (bucket_id = 'updates');
