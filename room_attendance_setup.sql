-- Run this script in the Supabase SQL Editor

-- 1. Create daily_attendance table
CREATE TABLE IF NOT EXISTS public.daily_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(id),
    roll_number TEXT NOT NULL,
    room_number TEXT NOT NULL,
    status TEXT DEFAULT 'present' NOT NULL, -- 'present' or 'absent'
    attendance_date DATE DEFAULT CURRENT_DATE NOT NULL,
    warden_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, attendance_date)
);

-- 2. Create Row Level Security Policies
ALTER TABLE public.daily_attendance ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Enable read access for all users" ON public.daily_attendance
    FOR SELECT USING (true);

-- Allow insert access for all users
CREATE POLICY "Enable insert for all users" ON public.daily_attendance
    FOR INSERT WITH CHECK (true);

-- Allow update access for all users
CREATE POLICY "Enable update for all users" ON public.daily_attendance
    FOR UPDATE USING (true);

-- Allow delete access for all users
CREATE POLICY "Enable delete for all users" ON public.daily_attendance
    FOR DELETE USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.daily_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_room ON public.daily_attendance(room_number);
