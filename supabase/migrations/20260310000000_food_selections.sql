-- ===================== MIGRATION 22: Food Selections Table =====================
CREATE TABLE IF NOT EXISTS public.food_selections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    food_item TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.food_selections ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_selections' AND policyname = 'Allow public read access on food_selections') THEN
        CREATE POLICY "Allow public read access on food_selections" ON public.food_selections FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_selections' AND policyname = 'Allow public insert on food_selections') THEN
        CREATE POLICY "Allow public insert on food_selections" ON public.food_selections FOR INSERT WITH CHECK (true);
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_selections' AND policyname = 'Allow public delete on food_selections') THEN
        CREATE POLICY "Allow public delete on food_selections" ON public.food_selections FOR DELETE USING (true);
    END IF;
END $$;

-- Add to realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'food_selections') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.food_selections;
    END IF;
END $$;

-- Create Storage Bucket for Study Materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study_materials', 'study_materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for study_materials
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public read on study_materials') THEN
        CREATE POLICY "Allow public read on study_materials" ON storage.objects FOR SELECT USING (bucket_id = 'study_materials');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow public uploads to study_materials') THEN
        CREATE POLICY "Allow public uploads to study_materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study_materials');
    END IF;
END $$;

