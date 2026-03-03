-- Create admins table
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  mobile_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
CREATE POLICY "Allow public read access on admins" 
ON public.admins 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on admins" 
ON public.admins 
FOR INSERT 
WITH CHECK (true);