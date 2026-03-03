-- Add email column to hostel_applications table
ALTER TABLE public.hostel_applications 
ADD COLUMN IF NOT EXISTS email TEXT;