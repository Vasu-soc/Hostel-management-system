-- Add batch information to students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS batch_start INTEGER,
ADD COLUMN IF NOT EXISTS batch_end INTEGER;

-- Set default batch based on year and created_at if possible
-- This is a one-time migration; new students will have these filled.
UPDATE public.students
SET 
  batch_start = EXTRACT(YEAR FROM created_at)::INTEGER,
  batch_end = (EXTRACT(YEAR FROM created_at) + 4)::INTEGER
WHERE batch_start IS NULL;
