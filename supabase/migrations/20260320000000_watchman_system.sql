-- Create Watchmen Table
CREATE TABLE IF NOT EXISTS public.watchmen (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    mobile_number TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.watchmen ENABLE ROW LEVEL SECURITY;

-- Allow public read for login
CREATE POLICY "Allow public read for watchmen login" ON public.watchmen
    FOR SELECT USING (true);

-- Allow admin to manage watchmen (if authenticated - simple for now)
CREATE POLICY "Allow service_role to manage watchmen" ON public.watchmen
    USING (true) WITH CHECK (true);
