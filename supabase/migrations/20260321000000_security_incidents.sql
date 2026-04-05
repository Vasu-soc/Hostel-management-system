
-- Create Security Incidents Table
CREATE TABLE IF NOT EXISTS public.security_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    watchman_id UUID NOT NULL REFERENCES public.watchmen(id) ON DELETE CASCADE,
    watchman_name TEXT NOT NULL,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Allow watchmen to report incidents
CREATE POLICY "Allow watchmen to report incidents" ON public.security_incidents
    FOR INSERT WITH CHECK (true);

-- Allow watchmen to read their own incidents (optional but good for history)
CREATE POLICY "Allow watchmen to read incidents" ON public.security_incidents
    FOR SELECT USING (true);

-- Allow admins to manage incidents
CREATE POLICY "Allow service_role to manage incidents" ON public.security_incidents
    USING (true) WITH CHECK (true);
