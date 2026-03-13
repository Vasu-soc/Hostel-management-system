
-- Create hostel_albums table
CREATE TABLE IF NOT EXISTS public.hostel_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_date DATE NOT NULL,
    image_urls TEXT[] NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by TEXT,
    warden_type TEXT -- 'boys' or 'girls'
);

-- Enable RLS
ALTER TABLE public.hostel_albums ENABLE ROW LEVEL SECURITY;

-- Allow all for now
CREATE POLICY "Enable all for everyone" ON public.hostel_albums FOR ALL USING (true);

COMMENT ON TABLE public.hostel_albums IS 'Stores hostel event albums with multiple images.';
