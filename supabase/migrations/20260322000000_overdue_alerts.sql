-- Create overdue_alerts table
CREATE TABLE IF NOT EXISTS public.overdue_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    roll_number TEXT NOT NULL,
    gate_pass_id UUID REFERENCES public.gate_passes(id) ON DELETE CASCADE,
    overdue_since TIMESTAMP WITH TIME ZONE NOT NULL,
    last_alerted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.overdue_alerts ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now following the project pattern
CREATE POLICY "Allow public read access on overdue_alerts" ON public.overdue_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on overdue_alerts" ON public.overdue_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on overdue_alerts" ON public.overdue_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on overdue_alerts" ON public.overdue_alerts FOR DELETE USING (true);

-- Add to realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'overdue_alerts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.overdue_alerts;
    END IF;
END $$;
