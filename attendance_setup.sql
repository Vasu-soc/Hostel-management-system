-- Run this script in the Supabase SQL Editor

-- 1. Create attendance_reports table
CREATE TABLE IF NOT EXISTS public.attendance_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL, -- e.g., 'Present', 'Absent', 'Late', 'On Leave'
    file_url TEXT, -- URL to the uploaded PDF/Image
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    warden_type TEXT -- (optional tracking for which type of warden uploaded it)
);

-- 2. Create Row Level Security Policies for the table
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for all users" ON public.attendance_reports
    FOR SELECT USING (true);

-- Allow insert access for all users (Warden acts as authenticated if sessions apply, or adjust depending on your auth)
CREATE POLICY "Enable insert for all users" ON public.attendance_reports
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON public.attendance_reports
    FOR DELETE USING (true);


-- 3. Create Storage bucket for attendance-reports
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-reports', 'attendance-reports', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket policies
CREATE POLICY "Public Access for attendance-reports"
ON storage.objects FOR SELECT
USING ( bucket_id = 'attendance-reports' );

CREATE POLICY "Allow Uploads for attendance-reports"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'attendance-reports' );

CREATE POLICY "Allow Deletes for attendance-reports"
ON storage.objects FOR DELETE
USING ( bucket_id = 'attendance-reports' );
