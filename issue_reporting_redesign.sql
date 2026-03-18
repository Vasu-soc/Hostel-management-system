-- Redesign Issue Reporting System for Structured Data

-- 1. Create room_issues table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.room_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id),
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    room_number TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add issue_type column to food_issues and electrical_issues to store structured sub-options
ALTER TABLE public.food_issues ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE public.electrical_issues ADD COLUMN IF NOT EXISTS issue_type TEXT;

-- 3. Enable RLS
ALTER TABLE public.room_issues ENABLE ROW LEVEL SECURITY;

-- Assuming standard RLS policies for simple setup
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_issues' AND policyname = 'Anyone can view room issues') THEN
    CREATE POLICY "Anyone can view room issues" ON public.room_issues FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_issues' AND policyname = 'Anyone can insert room issues') THEN
    CREATE POLICY "Anyone can insert room issues" ON public.room_issues FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'room_issues' AND policyname = 'Anyone can update room issues') THEN
    CREATE POLICY "Anyone can update room issues" ON public.room_issues FOR UPDATE USING (true);
  END IF;
END $$;
