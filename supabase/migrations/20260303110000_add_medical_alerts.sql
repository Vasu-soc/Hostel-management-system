-- Create medical_alerts table
CREATE TABLE IF NOT EXISTS public.medical_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id),
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    room_number TEXT,
    issue_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Real-time for this table
-- This allows the Warden and Parent dashboards to update instantly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'medical_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.medical_alerts;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.medical_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.medical_alerts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.medical_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.medical_alerts FOR UPDATE USING (true);
