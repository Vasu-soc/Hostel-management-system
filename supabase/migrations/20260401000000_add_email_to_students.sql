-- Add missing columns to students table for new registration fields
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS parent_photo_url TEXT,
ADD COLUMN IF NOT EXISTS guardian_photo_url TEXT;
