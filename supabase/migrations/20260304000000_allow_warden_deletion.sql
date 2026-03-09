-- Fix foreign key in medicines table to allow warden deletion
ALTER TABLE public.medicines 
DROP CONSTRAINT IF EXISTS medicines_created_by_fkey,
ADD CONSTRAINT medicines_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.wardens(id) 
ON DELETE CASCADE;

-- Ensure RLS allows deletion for wardens
-- First drop any existing restrictive policies
DROP POLICY IF EXISTS "No delete wardens" ON public.wardens;
DROP POLICY IF EXISTS "Allow public delete on wardens" ON public.wardens;
DROP POLICY IF EXISTS "Enable delete for anyone" ON public.wardens;

-- Create a fresh, highly permissive delete policy
CREATE POLICY "Enable delete for anyone" 
ON public.wardens 
FOR DELETE 
USING (true);

-- Ensure RLS is enabled (it should be, but just in case)
ALTER TABLE public.wardens ENABLE ROW LEVEL SECURITY;
