-- Create parents table for parent login
CREATE TABLE public.parents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  parent_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  student_roll_number TEXT NOT NULL,
  password TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on parents"
ON public.parents
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on parents"
ON public.parents
FOR INSERT
WITH CHECK (true);