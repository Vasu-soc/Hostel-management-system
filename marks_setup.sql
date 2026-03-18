-- Run this script in the Supabase SQL Editor

-- 1. Create branch_marks table
CREATE TABLE IF NOT EXISTS public.branch_marks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch TEXT NOT NULL,
    year TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    warden_id TEXT
);

-- 2. Create Row Level Security Policies for the table
ALTER TABLE public.branch_marks ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for all users" ON public.branch_marks
    FOR SELECT USING (true);

-- Allow insert access for all users
CREATE POLICY "Enable insert for all users" ON public.branch_marks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON public.branch_marks
    FOR DELETE USING (true);


-- 3. Create Storage bucket for branch-marks
INSERT INTO storage.buckets (id, name, public) VALUES ('branch-marks', 'branch-marks', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Public Access for branch-marks"
ON storage.objects FOR SELECT
USING ( bucket_id = 'branch-marks' );

CREATE POLICY "Allow Uploads for branch-marks"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'branch-marks' );

CREATE POLICY "Allow Deletes for branch-marks"
ON storage.objects FOR DELETE
USING ( bucket_id = 'branch-marks' );
