-- Add mandatory photo columns to students and parents tables
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_photo_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_photo_url TEXT;

ALTER TABLE public.parents ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ensure student-photos bucket is public and has correct policies (it should already be but just in case)
-- Policies are usually already set up for student-photos if it exists.
