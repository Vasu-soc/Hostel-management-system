-- Create medicines table for warden-managed medicine inventory
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '💊',
  warden_type TEXT NOT NULL CHECK (warden_type IN ('boys', 'girls')),
  is_available BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.wardens(id)
);

-- Enable Row Level Security
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- Create policies for medicine management
CREATE POLICY "Allow public read access on medicines" 
ON public.medicines 
FOR SELECT 
USING (true);

CREATE POLICY "Allow wardens to insert medicines" 
ON public.medicines 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow wardens to update medicines" 
ON public.medicines 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow wardens to delete medicines" 
ON public.medicines 
FOR DELETE 
USING (true);

-- Enable realtime for medicines
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;