-- Add email column to gate_passes table for notification
ALTER TABLE public.gate_passes ADD COLUMN IF NOT EXISTS student_email text;