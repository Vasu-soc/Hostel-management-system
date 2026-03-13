
-- Create recycle_bin table
CREATE TABLE IF NOT EXISTS public.recycle_bin (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    original_id TEXT NOT NULL,
    data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    warden_type TEXT -- 'boys' or 'girls' or NULL for all
);

-- Policy to allow all for now (simple implementation)
ALTER TABLE public.recycle_bin ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for everyone" ON public.recycle_bin FOR ALL USING (true);

-- Enable RLS for the table
COMMENT ON TABLE public.recycle_bin IS 'Stores deleted records for a minimum of 30 days.';
